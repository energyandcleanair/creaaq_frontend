import City from '@/entities/City'
import Regulation from '@/entities/Regulation'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'

export default interface ChartData {
  cities: City[]
  violations: Violation[]
  pollutants: Pollutant[]
  regulations: Regulation[]
  targets: Target[]
}
