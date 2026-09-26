import React from 'react';

interface BarcodeDisplayProps {
  value: string;
  format?: string;
  sku?: string;
  name?: string;
  binLocation?: string;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Pure SVG procedural Code 128 / EAN-style barcode generator.
 * Deterministically generates high-contrast barcode patterns from any alphanumeric string.
 */
export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  sku,
  name,
  binLocation,
  height = 42,
  showText = true,
  className = '',
}) => {
  // Generate deterministic pattern based on characters
  const bars: { width: number; isBlack: boolean }[] = [];

  // Start quiet zone & start pattern
  bars.push({ width: 3, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });

  const safeVal = (value || '000000000000').toUpperCase();
  for (let i = 0; i < safeVal.length; i++) {
    const charCode = safeVal.charCodeAt(i);
    const patternVal = (charCode * (i + 3)) % 16;

    // Convert pattern to alternating black & white bars
    const b1 = (patternVal & 1) ? 2 : 1;
    const b2 = (patternVal & 2) ? 2 : 1;
    const b3 = (patternVal & 4) ? 3 : 1;
    const b4 = (patternVal & 8) ? 2 : 1;

    bars.push({ width: b1, isBlack: false });
    bars.push({ width: b2, isBlack: true });
    bars.push({ width: b3, isBlack: false });
    bars.push({ width: b4, isBlack: true });
  }

  // Stop guard pattern
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 3, isBlack: true });
  bars.push({ width: 4, isBlack: false });

  let totalWidth = 0;
  bars.forEach((b) => (totalWidth += b.width));

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded border border-slate-200 shadow-xs ${className}`}>
      {sku && (
        <div className="w-full flex items-center justify-between text-[11px] font-mono font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1">
          <span className="truncate max-w-[140px]">{sku}</span>
          {binLocation && (
            <span className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">
              {binLocation}
            </span>
          )}
        </div>
      )}

      {name && (
        <div className="w-full text-[11px] text-slate-600 truncate max-w-[200px] mb-1 font-medium">
          {name}
        </div>
      )}

      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[220px]"
        style={{ height }}
        shapeRendering="crispEdges"
      >
        {bars.map((bar, idx) => {
          const rect = (
            <rect
              key={idx}
              x={currentX}
              y={0}
              width={bar.width}
              height={height}
              fill={bar.isBlack ? '#0f172a' : '#ffffff'}
            />
          );
          currentX += bar.width;
          return rect;
        })}
      </svg>

      {showText && (
        <span className="text-[11px] font-mono tracking-widest text-slate-700 mt-1 tabular-nums font-medium">
          {value}
        </span>
      )}
    </div>
  );
};
