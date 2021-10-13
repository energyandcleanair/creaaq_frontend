import City from '@/entities/City'
import Guideline from '@/entities/Guideline'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'

export default interface ChartData {
  cities: City[]
  violations: Violation[]
  pollutants: Pollutant[]
  guidelines: Guideline[]
  targets: Target[]
}
