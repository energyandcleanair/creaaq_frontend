import City from '@/entities/City'
import Regulation from '@/entities/Regulation'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'

export default interface URLQuery {
  cities: City['id'][]
  pollutants: Pollutant['id'][]
  targets: Target['id'][]
  regulations: Regulation['id'][]
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

  // date_start
  start?: string

  // overshooting
  ovshoot?: string
}
