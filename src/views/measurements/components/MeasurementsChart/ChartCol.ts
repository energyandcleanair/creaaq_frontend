import RangeBox from './RangeBox'

export default interface ChartCol {
  id: string
  title: string
  data: any
  layout: any
  rangeBox: RangeBox
  isEmpty?: boolean
}