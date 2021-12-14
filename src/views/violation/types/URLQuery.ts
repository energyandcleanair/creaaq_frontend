import City from '@/entities/City'
import Guideline from '@/entities/Guideline'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'

export default interface URLQuery {
  cities: City['id'][]
  pollutants: Pollutant['id'][]
  targets: Target['id'][]
  guidelines: Guideline['id'][]
  date_start?: string
  overshooting?: boolean
  need_reload?: boolean
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // pollutants
  pl?: string[]

  // targets
  tg?: string[]

  // guidelines
  gl?: string[]

  // date_start
  start?: string

  // overshooting
  ovshoot?: string

  // need_reload
  need_rld?: string
}
