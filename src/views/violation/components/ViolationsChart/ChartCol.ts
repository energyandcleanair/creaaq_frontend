import Violation from '@/entities/Violation'
import TooltipParams from './TooltipParams'

export default interface ChartCol {
  id: string
  title: string
  firstDate: string
  dates: {
    [date: number]: {
      color: string
      violations: Violation[]
      class?: string
      tooltip: TooltipParams
    }
  }
  isEmpty?: boolean
}
