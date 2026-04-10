// ============================================================
// Rakshak AI - Trust Score Gauge Component
// Circular SVG gauge matching the design image exactly
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { getTrustScoreInfo } from '../../utils/formatters';

export default function TrustScoreGauge({ score = 92, status = 'EXTREME SECURITY', small = false }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animRef = useRef(null);

  const size = small ? 100 : 140;
  const strokeWidth = small ? 8 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Show 270 degrees of arc (leave gap at bottom)
  const arcLength = circumference * 0.75;
  const offset = circumference * 0.125; // start at 135deg

  const scoreInfo = getTrustScoreInfo(score);
  const progress = (animatedScore / 100) * arcLength;
  const dashOffset = arcLength - progress;

  useEffect(() => {
    let start = null;
    const duration = 1500;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-[135deg]"
        >
          {/* Background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreInfo.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="gauge-arc"
            style={{
              filter: `drop-shadow(0 0 6px ${scoreInfo.color}88)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: small ? '1.75rem' : '2.5rem',
              color: 'white',
              lineHeight: 1,
            }}
          >
            {animatedScore}
          </span>
          {!small && (
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mt-1">
              {status.split(' ').slice(-1)[0]}
            </span>
          )}
        </div>
      </div>
      {!small && (
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mt-1">
          {status}
        </p>
      )}
    </div>
  );
}
