import Pollutant from '@/entities/Pollutant'
import ChartCol from './ChartCol'
import RangeBox from './RangeBox'

export default interface ChartRow {
  id: string
  title: string
  subtitle?: string
  cols: ChartCol[]
  rangeBox: RangeBox
  pollutantId: Pollutant['id']
}