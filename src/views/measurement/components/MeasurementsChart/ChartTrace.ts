enum ChartTraceLevels {
  CITY = 'CITY',
  STATION = 'STATION',
}

export {ChartTraceLevels}

export default interface ChartTrace {
  x: (number | Date)[]
  y: (number | null)[]
  level: ChartTraceLevels
  type: string
  name: string | number

  zIndex?: number
  mode?: string
  line?: any
  unit?: string
  hovertemplate: string
}
