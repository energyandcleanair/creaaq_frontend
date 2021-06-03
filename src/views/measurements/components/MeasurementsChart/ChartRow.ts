import ChartCol from './ChartCol'
import RangeBox from './RangeBox'

export default interface ChartRow {
  id: string
  title: string
  cols: ChartCol[]
  rangeBox: RangeBox
}