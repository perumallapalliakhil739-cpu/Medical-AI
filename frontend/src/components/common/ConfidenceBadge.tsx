import React from 'react';
import { useConfig } from '../../context/ConfigContext';

interface ConfidenceBadgeProps {
  score?: number | null;
  showPercentage?: boolean;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  showPercentage = true,
  className = '',
}) => {
  const { getConfidenceLevel } = useConfig();
  const level = getConfidenceLevel(score);
  const percentage = score !== null && score !== undefined ? Math.round(score * 100) : 0;

  const config = {
    high: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: '🟢',
      label: 'High Confidence',
    },
    medium: {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: '🟡',
      label: 'Moderate Confidence',
    },
    low: {
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500 animate-pulse',
      icon: '🔴',
      label: 'Review Required',
    },
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}
      title={`${config.label} (${percentage}%)`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showPercentage && <span>{percentage}%</span>}
      <span className="text-[10px] font-normal opacity-80 hidden sm:inline">
        {level === 'high' ? 'High' : level === 'medium' ? 'Med' : 'Review'}
      </span>
    </span>
  );
};
