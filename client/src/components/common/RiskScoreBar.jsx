// ============================================================
// Rakshak AI - Risk Score Bar Component
// Horizontal colored bar showing risk intensity
// ============================================================

import { getRiskLevel } from '../../utils/formatters';

export default function RiskScoreBar({ score, showLabel = true, height = 'h-2' }) {
  const { label, barColor } = getRiskLevel(score || 0);
  const width = `${Math.min(100, score || 0)}%`;

  const gradientMap = {
    '#22c55e': 'from-green-400 to-green-500',
    '#f97316': 'from-orange-400 to-orange-500',
    '#ef4444': 'from-red-400 to-red-500',
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 bg-cream rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r ${gradientMap[barColor]} transition-all duration-700`}
          style={{ width }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-dark/60 tabular-nums w-8 text-right">
          {score || 0}
        </span>
      )}
    </div>
  );
}
