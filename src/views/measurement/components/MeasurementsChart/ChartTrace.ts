export default interface ChartTrace {
  x: (number|Date)[]
  y: (number|null)[]
  type: string
  name: string|number

  zIndex?: number
  mode?: string
  line?: any
  hovertemplate: string
}