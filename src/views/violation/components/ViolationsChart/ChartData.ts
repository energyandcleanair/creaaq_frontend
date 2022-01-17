import City from '@/entities/City'
import Country from '@/entities/Country'
import Regulation from '@/entities/Regulation'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'

export default interface ChartData {
  cities: City[]
  countriesMap: Map<Country['id'], Country>
  violations: Violation[]
  pollutants: Pollutant[]
  regulations: Regulation[]
  targets: Target[]
}
