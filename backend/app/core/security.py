"""
Cryptographic security and JWT token utilities for MedLens.
Ensures zero plaintext password storage and tamper-evident authentication sessions.
Implements RFC 7519 HMAC-SHA256 (HS256) standard-library JWT handling with zero external runtime dependencies.
"""

import os
import hmac
import hashlib
import json
import base64
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from app.core.config import settings

# JWT configuration
JWT_ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
PBKDF2_ITERATIONS = 100_000


class ExpiredSignatureError(Exception):
    """Raised when an authentication token has expired."""
    pass


class InvalidTokenError(Exception):
    """Raised when an authentication token signature or payload is invalid."""
    pass


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using PBKDF2-HMAC-SHA256 with a cryptographically secure salt.
    Format: pbkdf2_sha256$iterations$salt_hex$hash_hex
    """
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        PBKDF2_ITERATIONS
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against the stored PBKDF2 hash using constant-time comparison.
    """
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_key = bytes.fromhex(parts[3])

        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt,
            iterations
        )
        return hmac.compare_digest(computed_key, expected_key)
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    """Base64 URL-safe encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def _b64url_decode(data: str) -> bytes:
    """Base64 URL-safe decode restoring padding if necessary."""
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data.encode('utf-8'))


def create_access_token(
    subject: str,
    extra_claims: Optional[dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a signed JWT access token using standard library HMAC-SHA256.
    """
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES))

    header = {"alg": "HS256", "typ": "JWT"}
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "MedLens-Auth"
    }
    if extra_claims:
        payload.update(extra_claims)

    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    header_b64 = _b64url_encode(header_bytes)
    payload_b64 = _b64url_encode(payload_bytes)

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT access token.
    Raises ExpiredSignatureError on expired token and InvalidTokenError on bad signature/format.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise InvalidTokenError("Invalid token format")

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise InvalidTokenError("Signature verification failed")

        payload_raw = _b64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_raw)

        # Expiration verification
        exp = payload.get("exp")
        if exp is not None:
            if time.time() > float(exp):
                raise ExpiredSignatureError("Token has expired")

        # Issuer verification
        if payload.get("iss") != "MedLens-Auth":
            raise InvalidTokenError("Invalid token issuer")

        return payload
    except (ExpiredSignatureError, InvalidTokenError):
        raise
    except Exception as exc:
        raise InvalidTokenError(f"Failed to decode token: {exc}") from exc
