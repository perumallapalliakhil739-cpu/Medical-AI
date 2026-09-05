import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { Button, Card, CardTitle, Alert } from '../components/ui';

// Mock fetch for API health calls during component mounting
beforeEach(() => {
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              status: 'ok',
              service: 'MedLens API',
              application: 'MedLens — AI-Powered Clinical Information Intelligence',
              version: '0.1.0',
              environment: 'test',
              timestamp: new Date().toISOString(),
              database: {
                status: 'connected',
                engine: 'PostgreSQL 16+',
                dialect: 'postgresql',
                latency_ms: 1.2,
                error: null,
              },
              storage: {
                status: 'ready',
                upload_directory: '../uploads',
                writable: true,
                max_upload_size_mb: 25,
              },
              safety_protocol: {
                autonomous_diagnosis_allowed: false,
                medication_prescription_allowed: false,
                dosage_alteration_allowed: false,
                treatment_protocol_generation_allowed: false,
                healthcare_provider_replacement_allowed: false,
                human_in_the_loop_required: true,
                provenance_tracking_enforced: true,
              },
              safety_disclaimer:
                'MedLens is an assistive clinical intelligence platform and does not formulate medical diagnosis or treatments.',
            })
          ),
        json: () =>
          Promise.resolve({
            status: 'ok',
            service: 'MedLens API',
            application: 'MedLens — AI-Powered Clinical Information Intelligence',
            version: '0.1.0',
            environment: 'test',
            timestamp: new Date().toISOString(),
            database: {
              status: 'connected',
              engine: 'PostgreSQL 16+',
              dialect: 'postgresql',
              latency_ms: 1.2,
              error: null,
            },
            storage: {
              status: 'ready',
              upload_directory: '../uploads',
              writable: true,
              max_upload_size_mb: 25,
            },
            safety_protocol: {
              autonomous_diagnosis_allowed: false,
              medication_prescription_allowed: false,
              dosage_alteration_allowed: false,
              treatment_protocol_generation_allowed: false,
              healthcare_provider_replacement_allowed: false,
              human_in_the_loop_required: true,
              provenance_tracking_enforced: true,
            },
            safety_disclaimer:
              'MedLens is an assistive clinical intelligence platform and does not formulate medical diagnosis or treatments.',
          }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });

  vi.stubGlobal('fetch', mockFetch);
});

describe('MedLens Main Application', () => {
  it('renders the MedLens application brand and layout', async () => {
    render(<App />);

    // Brand elements
    const brandTitles = await screen.findAllByText(/MedLens/i);
    expect(brandTitles.length).toBeGreaterThan(0);

    // Clinical Safety Banner must always be rendered
    const safetyNotices = await screen.findAllByText(/Clinical Information Intelligence/i);
    expect(safetyNotices.length).toBeGreaterThan(0);
  });

  it('renders the Clinical Safety Boundaries and rules', async () => {
    render(<App />);

    // Verify critical safety notice is present
    const safetyNotices = await screen.findAllByText(/Clinical Information Platform Notice/i);
    expect(safetyNotices.length).toBeGreaterThan(0);

    // Verify safety guard badge
    const safetyGuards = await screen.findAllByText(/Safety Guard Active/i);
    expect(safetyGuards.length).toBeGreaterThan(0);
  });

  it('renders reusable UI components properly', () => {
    render(
      <div>
        <Button variant="primary">Clinical Action</Button>
        <Card>
          <CardTitle>Telemetry Card</CardTitle>
        </Card>
        <Alert variant="clinical">Safety Disclaimer</Alert>
      </div>
    );

    expect(screen.getByText('Clinical Action')).toBeInTheDocument();
    expect(screen.getByText('Telemetry Card')).toBeInTheDocument();
    expect(screen.getByText('Safety Disclaimer')).toBeInTheDocument();
  });
});
