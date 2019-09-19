export interface BorderStyle {
  stroke: string
  strokeWidth?: number
  strokeDashArray?: Array<number>
}

const defaultBorderColor = '#e6e6e6'

export { defaultBorderColor }

export default function getBorder ({ color, type }: { color: string, type?: string }): BorderStyle {
  switch (type) {
    case 'medium':
      return {
        stroke: color,
        strokeWidth: 1.5
      }
    case 'thick':
      return {
        stroke: color,
        strokeWidth: 3
      }
    case 'dashed':
      return {
        stroke: color,
        strokeDashArray: [3, 2]
      }
    case 'double':
      return {
        stroke: color,
        strokeDashArray: [2, 0]
      }
    default:
      return {
        stroke: color,
        strokeWidth: 0.5
      }
  }
}
