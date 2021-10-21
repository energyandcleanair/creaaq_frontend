import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'

export default interface MapChartData {
  cities: City[]
  stations: Station[]
  pollutants: Pollutant[]
  sources: Source[]
}
