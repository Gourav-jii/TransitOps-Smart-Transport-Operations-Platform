import { useState } from "react"

// Define general interfaces
interface ChartDataPoint {
  label: string
  value: number
  secondaryValue?: number
}

// ----------------------------------------------------
// 1. LINE CHART (SVG Based)
// ----------------------------------------------------
interface LineChartProps {
  data: ChartDataPoint[]
  color?: string
  secondaryColor?: string
  height?: number
  showSecondary?: boolean
  secondaryLabel?: string
  primaryLabel?: string
}

export function LineChart({
  data,
  color = "#3b82f6",
  secondaryColor = "#8b5cf6",
  height = 200,
  showSecondary = false,
  primaryLabel = "Value",
  secondaryLabel = "Secondary",
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No data available</div>
  }

  const values = data.map((d) => d.value)
  const secondaryValues = data.map((d) => d.secondaryValue || 0)
  
  const maxValue = Math.max(...values, ...(showSecondary ? secondaryValues : []), 1)
  const minValue = 0

  const padding = { top: 20, right: 30, bottom: 30, left: 50 }
  const chartWidth = 500
  const chartHeight = height
  
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Helper to map values to SVG space
  const getX = (index: number) => padding.left + (index / (data.length - 1)) * innerWidth
  const getY = (val: number) => {
    const scale = (val - minValue) / (maxValue - minValue)
    return padding.top + innerHeight - scale * innerHeight
  }

  // Generate path lines
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(" ")
  const secondaryPoints = showSecondary
    ? data.map((d, i) => `${getX(i)},${getY(d.secondaryValue || 0)}`).join(" ")
    : ""

  // Generate grid values
  const yTicks = 4
  const gridLines = Array.from({ length: yTicks }).map((_, i) => {
    const val = minValue + (maxValue - minValue) * (i / (yTicks - 1))
    return {
      value: val,
      y: getY(val),
    }
  })

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
        {/* Y Axis Grid Lines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={chartWidth - padding.right}
              y2={line.y}
              className="stroke-border/40"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px] font-mono"
            >
              {line.value >= 1000 ? `${(line.value / 1000).toFixed(1)}k` : Math.round(line.value)}
            </text>
          </g>
        ))}

        {/* Primary Line Path */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Primary Area Fill Gradient */}
        <path
          d={`M ${getX(0)} ${getY(0)} L ${points} L ${getX(data.length - 1)} ${getY(0)} Z`}
          fill={`url(#gradient-${color.replace("#", "")})`}
          opacity={0.12}
        />

        {/* Secondary Line Path (if requested) */}
        {showSecondary && (
          <>
            <polyline
              fill="none"
              stroke={secondaryColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={secondaryPoints}
            />
            <path
              d={`M ${getX(0)} ${getY(0)} L ${secondaryPoints} L ${getX(data.length - 1)} ${getY(0)} Z`}
              fill={`url(#gradient-${secondaryColor.replace("#", "")})`}
              opacity={0.12}
            />
          </>
        )}

        {/* Gradients */}
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {showSecondary && (
            <linearGradient id={`gradient-${secondaryColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>

        {/* X Axis Labels */}
        {data.map((d, idx) => {
          // Show label every N entries to prevent overlap
          const showLabel = data.length < 8 || idx % 2 === 0
          return (
            showLabel && (
              <text
                key={idx}
                x={getX(idx)}
                y={chartHeight - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] font-semibold"
              >
                {d.label}
              </text>
            )
          )
        })}

        {/* Interactive points & hover regions */}
        {data.map((d, idx) => (
          <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
            <rect
              x={getX(idx) - innerWidth / (data.length * 2)}
              y={padding.top}
              width={innerWidth / data.length}
              height={innerHeight}
              fill="transparent"
              className="cursor-pointer"
            />
            {hoveredIndex === idx && (
              <>
                <line
                  x1={getX(idx)}
                  y1={padding.top}
                  x2={getX(idx)}
                  y2={chartHeight - padding.bottom}
                  className="stroke-primary/30"
                  strokeWidth={1}
                />
                <circle cx={getX(idx)} cy={getY(d.value)} r={4} fill={color} stroke="white" strokeWidth={1} />
                {showSecondary && (
                  <circle
                    cx={getX(idx)}
                    cy={getY(d.secondaryValue || 0)}
                    r={4}
                    fill={secondaryColor}
                    stroke="white"
                    strokeWidth={1}
                  />
                )}
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Floating Tooltip Box */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className="absolute top-2 right-2 bg-popover border border-border/80 px-2.5 py-1.5 rounded-lg shadow-xl text-[10px] pointer-events-none space-y-0.5 text-left select-none z-10 animate-in fade-in zoom-in-95 duration-150">
          <p className="font-bold text-foreground mb-0.5">{data[hoveredIndex].label}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span>
              {primaryLabel}: <strong className="text-foreground">${data[hoveredIndex].value.toLocaleString()}</strong>
            </span>
          </div>
          {showSecondary && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span>
                {secondaryLabel}: <strong className="text-foreground">${(data[hoveredIndex].secondaryValue || 0).toLocaleString()}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------
// 2. BAR CHART (Vertical, Multi or Single)
// ----------------------------------------------------
interface BarChartProps {
  data: ChartDataPoint[]
  color?: string
  secondaryColor?: string
  height?: number
  showSecondary?: boolean
  primaryLabel?: string
  secondaryLabel?: string
}

export function BarChart({
  data,
  color = "#3b82f6",
  secondaryColor = "#8b5cf6",
  height = 200,
  showSecondary = false,
  primaryLabel = "Value",
  secondaryLabel = "Secondary",
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No data available</div>
  }

  const values = data.map((d) => d.value)
  const secondaryValues = data.map((d) => d.secondaryValue || 0)
  
  const maxValue = Math.max(...values, ...(showSecondary ? secondaryValues : []), 1)
  const minValue = 0

  const padding = { top: 20, right: 30, bottom: 30, left: 50 }
  const chartWidth = 500
  const chartHeight = height
  
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const getBarHeight = (val: number) => {
    const scale = (val - minValue) / (maxValue - minValue)
    return scale * innerHeight
  }

  const yTicks = 4
  const gridLines = Array.from({ length: yTicks }).map((_, i) => {
    const val = minValue + (maxValue - minValue) * (i / (yTicks - 1))
    const scale = (val - minValue) / (maxValue - minValue)
    return {
      value: val,
      y: padding.top + innerHeight - scale * innerHeight,
    }
  })

  const groupWidth = innerWidth / data.length
  const barWidth = showSecondary ? groupWidth * 0.35 : groupWidth * 0.6

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
        {/* Y Axis Grid Lines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={chartWidth - padding.right}
              y2={line.y}
              className="stroke-border/40"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px] font-mono"
            >
              {line.value >= 1000 ? `${(line.value / 1000).toFixed(1)}k` : Math.round(line.value)}
            </text>
          </g>
        ))}

        {/* Draw Bars */}
        {data.map((d, idx) => {
          const groupX = padding.left + idx * groupWidth
          const primaryH = getBarHeight(d.value)
          const primaryY = padding.top + innerHeight - primaryH

          const secH = showSecondary ? getBarHeight(d.secondaryValue || 0) : 0
          const secY = padding.top + innerHeight - secH

          const primaryBarX = showSecondary ? groupX + groupWidth * 0.12 : groupX + groupWidth * 0.2
          const secBarX = groupX + groupWidth * 0.52

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Primary Bar */}
              <rect
                x={primaryBarX}
                y={primaryY}
                width={barWidth}
                height={Math.max(primaryH, 1)}
                fill={color}
                rx={3}
                className="transition-all duration-300 opacity-90 hover:opacity-100"
              />

              {/* Secondary Bar */}
              {showSecondary && (
                <rect
                  x={secBarX}
                  y={secY}
                  width={barWidth}
                  height={Math.max(secH, 1)}
                  fill={secondaryColor}
                  rx={3}
                  className="transition-all duration-300 opacity-90 hover:opacity-100"
                />
              )}

              {/* X Axis Label */}
              <text
                x={groupX + groupWidth / 2}
                y={chartHeight - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] font-semibold"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Floating Tooltip Box */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className="absolute top-2 right-2 bg-popover border border-border/80 px-2.5 py-1.5 rounded-lg shadow-xl text-[10px] pointer-events-none space-y-0.5 text-left select-none z-10 animate-in fade-in duration-150">
          <p className="font-bold text-foreground mb-0.5">{data[hoveredIndex].label}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span>
              {primaryLabel}: <strong className="text-foreground">${data[hoveredIndex].value.toLocaleString()}</strong>
            </span>
          </div>
          {showSecondary && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span>
                {secondaryLabel}: <strong className="text-foreground">${(data[hoveredIndex].secondaryValue || 0).toLocaleString()}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------
// 3. PIE / DONUT CHART (SVG Circles with Dasharray)
// ----------------------------------------------------
interface PieChartProps {
  data: Array<{ label: string; value: number }>
  colors?: string[]
}

export function PieChart({
  data,
  colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"],
}: PieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const total = data.reduce((acc, curr) => acc + curr.value, 0)
  
  if (total === 0) {
    return <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">No data available</div>
  }

  const radius = 50
  const circ = 2 * Math.PI * radius
  
  let accumulatedPercent = 0

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2 select-none">
      
      {/* SVG Donut Circle */}
      <div className="relative h-32 w-32 flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" className="stroke-muted/15" strokeWidth={12} />
          {data.map((item, idx) => {
            const percent = item.value / total
            const strokeLength = percent * circ
            const strokeOffset = circ - strokeLength + (accumulatedPercent * circ)
            
            accumulatedPercent -= percent
            const col = colors[idx % colors.length]

            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={col}
                strokeWidth={12}
                strokeDasharray={circ}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                style={{
                  transformOrigin: "60px 60px",
                  transform: hoveredIdx === idx ? "scale(1.05)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            )
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-foreground">
            {hoveredIdx !== null ? data[hoveredIdx].value : total}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">
            {hoveredIdx !== null ? data[hoveredIdx].label : "Total Records"}
          </span>
        </div>
      </div>

      {/* Side Legend */}
      <div className="flex flex-col items-start gap-1.5 max-w-[140px] text-left">
        {data.map((item, idx) => {
          const col = colors[idx % colors.length]
          const pct = ((item.value / total) * 100).toFixed(0)
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                hoveredIdx === idx ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
              <span className="text-xs truncate w-20">{item.label}</span>
              <span className="text-[10px] font-bold text-foreground font-mono">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ----------------------------------------------------
// 4. HORIZONTAL BAR CHART (Vehicle ROI ranking lists)
// ----------------------------------------------------
interface HorizontalBarProps {
  data: Array<{ label: string; value: number }>
  color?: string
}

export function HorizontalBar({ data, color = "#3b82f6" }: HorizontalBarProps) {
  if (!data || data.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No ROI logs recorded</div>
  }

  const values = data.map((d) => d.value)
  const maxVal = Math.max(...values, 1)

  return (
    <div className="space-y-3.5 select-none py-2 text-left">
      {data.map((item, idx) => {
        const pct = Math.max((item.value / maxVal) * 100, 2)
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground/90">{item.label}</span>
              <span className="font-mono text-primary">${item.value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------
// 5. PROGRESS RING / GAUGE (Utilization progress circle)
// ----------------------------------------------------
interface ProgressRingProps {
  percent: number
  color?: string
  size?: number
}

export function ProgressRing({ percent, color = "#10b981", size = 120 }: ProgressRingProps) {
  const radius = 40
  const strokeWidth = 8
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.min(percent, 100) / 100) * circ

  return (
    <div className="flex flex-col items-center justify-center select-none py-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" className="stroke-muted/15" strokeWidth={strokeWidth} />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-foreground font-mono">{percent}%</span>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">Fleet Active</span>
        </div>
      </div>
    </div>
  )
}
