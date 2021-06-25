import ChartTrace from './ChartTrace'
import RangeBox from './RangeBox'

export default interface ChartData {
  data: ChartTrace[]
  rangeBox: RangeBox
}