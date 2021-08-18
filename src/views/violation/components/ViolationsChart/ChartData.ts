import City from '@/entities/City'
import Organization from '@/entities/Organization'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'

export default interface ChartData {
  cities: City[]
  violations: Violation[]
  pollutants: Pollutant[]
  organizations: Organization[]
  targets: Target[]
}
