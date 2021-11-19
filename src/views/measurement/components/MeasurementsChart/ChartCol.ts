import ChartTrace from './ChartTrace'
import RangeBox from './RangeBox'

export default interface ChartCol {
  id: string
  title: string
  data: ChartTrace[]
  layout: any
  rangeBox: RangeBox
  isEmpty?: boolean
}
