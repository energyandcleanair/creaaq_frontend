import City from '@/entities/City'
import Station from '@/entities/Station'

export default interface ChartData {
  cities: City[]
  stations: Station[]
}