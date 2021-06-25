import City from '@/entities/City'
import Measurement from '@/entities/Measurement'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'

export default interface ChartParams {
  dateStart: number
  dateEnd: number
  cities: City[]
  measurements: Measurement[]
  pollutants: Pollutant[]
  sources: Source[]
  stations: Station[]
}