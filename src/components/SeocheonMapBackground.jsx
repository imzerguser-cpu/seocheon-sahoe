const REGIONS = [
  { name: '서천읍', cx: 180, cy: 220, rx: 55, ry: 40, color: '#ffd9a8' },
  { name: '장항읍', cx: 90, cy: 300, rx: 50, ry: 45, color: '#a8e6cf' },
  { name: '마서면', cx: 220, cy: 160, rx: 45, ry: 35, color: '#ffd9a8' },
  { name: '화양면', cx: 130, cy: 130, rx: 45, ry: 35, color: '#a8e6cf' },
  { name: '기산면', cx: 260, cy: 230, rx: 40, ry: 35, color: '#ffe0b2' },
  { name: '한산면', cx: 310, cy: 190, rx: 45, ry: 38, color: '#c8f0d8' },
  { name: '마산면', cx: 350, cy: 250, rx: 42, ry: 34, color: '#ffd9a8' },
  { name: '시초면', cx: 300, cy: 300, rx: 40, ry: 34, color: '#a8e6cf' },
  { name: '문산면', cx: 250, cy: 340, rx: 42, ry: 34, color: '#ffe0b2' },
  { name: '판교면', cx: 340, cy: 340, rx: 45, ry: 36, color: '#c8f0d8' },
  { name: '종천면', cx: 190, cy: 300, rx: 42, ry: 34, color: '#ffd9a8' },
  { name: '비인면', cx: 140, cy: 380, rx: 48, ry: 38, color: '#a8e6cf' },
  { name: '서면', cx: 80, cy: 420, rx: 50, ry: 40, color: '#ffe0b2' },
]

export default function SeocheonMapBackground() {
  return (
    <svg
      className="seocheon-map-background"
      viewBox="0 0 420 480"
      aria-hidden="true"
      focusable="false"
    >
      {REGIONS.map((region) => (
        <ellipse
          key={region.name}
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          fill={region.color}
          opacity="0.12"
        />
      ))}
    </svg>
  )
}
