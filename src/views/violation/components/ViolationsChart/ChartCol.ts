import Violation from '@/entities/Violation'

export default interface ChartCol {
  id: string
  title: string
  firstDate: string
  dates: {
    [date: number]: {
      color: string
      violations: Violation[]
      tooltip: {
        title: string
        subtitle: string
        tableHeaders: any[]
        tableItems: any[]
      }
    }
  }
  isEmpty?: boolean
}