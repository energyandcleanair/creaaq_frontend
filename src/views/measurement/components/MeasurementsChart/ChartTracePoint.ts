import moment from 'moment'

export default interface ChartTracePoint {
  x: number
  y: number
  $date: moment.Moment
  $origDate: moment.Moment
}
