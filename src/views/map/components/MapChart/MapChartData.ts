import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'

export default interface MapChartData {
  cities: City[]
  stations: Station[]
  pollutants: Pollutant[]
}
