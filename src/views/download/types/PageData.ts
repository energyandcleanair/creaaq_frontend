import City from '@/entities/City'
import Measurement from '@/entities/Measurement'
import Pollutant from '@/entities/Pollutant'
// import Source from '@/entities/Source'
import Station from '@/entities/Station'

export default interface PageData {
  cities: City[]
  stations: Station[]
  measurements: Measurement[]
  pollutants: Pollutant[]
  // sources: Source[]
}
