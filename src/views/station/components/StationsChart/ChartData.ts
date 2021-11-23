import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'

export default interface ChartData {
  cities: City[]
  stations: Station[]
  sources: Source[]
  pollutants: Pollutant[]
}
