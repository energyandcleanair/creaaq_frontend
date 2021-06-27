export default interface ChartCol {
  id: string
  title: string
  date: string
  events: {
    // [date: string]: number
    [date: string]: any
  }
  isEmpty?: boolean
}