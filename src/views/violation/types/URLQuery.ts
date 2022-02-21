import City from '@/entities/City'
import Regulation from '@/entities/Regulation'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import Source from '@/entities/Source'

export type yyyymmdd = string

export default interface URLQuery {
  cities: City['id'][]
  pollutants: Pollutant['id'][]
  targets: Target['id'][]
  regulations: Regulation['id'][]
  sources: Source['id'][]
  date_start?: string
  overshooting?: boolean
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // pollutants
  pl?: string[]

  // targets
  tg?: string[]

  // regulations
  rg?: string[]

  // sources
  sr?: string[]

  // date_start
  start?: string

  // overshooting
  ovshoot?: string
}
