import City from '@/entities/City'
import ChartCol from './ChartCol'

export default interface ChartRow {
  id: string
  title: string
  cols: ChartCol[]
  cityId: City['id']
}