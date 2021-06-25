export default interface ChartTrace {
  x: (number|Date)[]
  y: number[]
  type: string
  name: string

  zIndex?: number
  mode?: string
  line?: any
  hovertemplate: string
}