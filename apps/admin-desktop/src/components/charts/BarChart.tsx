import type { MetricBarPoint } from '../../types';

export function BarChart({ data, color = 'var(--primary)', height = 160 }: { data: MetricBarPoint[]; color?: string; height?: number }) {
  const max = Math.max(...data.map((entry) => entry.value), 1);
  const width = 480;
  const chartHeight = height - 28;
  const barWidth = width / data.length - 14;

  return (
    <div className="bar-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="bar chart">
        {data.map((entry, index) => {
          const barHeight = (entry.value / max) * chartHeight;
          const x = index * (width / data.length) + 8;
          const y = chartHeight - barHeight + 8;
          return (
            <g key={entry.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="8" fill={color} opacity="0.9" />
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="chart-label">{entry.label}</text>
              <title>{`${entry.label}: ${entry.value}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
