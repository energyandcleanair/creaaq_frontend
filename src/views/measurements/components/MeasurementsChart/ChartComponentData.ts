import City from '@/entities/City'
import Measurement from '@/entities/Measurement'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'

export default interface ChartComponentData {
  cities: City[]
  measurements: Measurement[]
  pollutants: Pollutant[]
  sources: Source[]
}