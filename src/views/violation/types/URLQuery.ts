import City from '@/entities/City'
import Organization from '@/entities/Organization'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'

export default interface URLQuery {
  cities: City['id'][]
  pollutants: Pollutant['id'][]
  targets: Target['id'][]
  organizations: Organization['id'][]
  date_start?: string
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // pollutants
  pl?: string[]

  // targets
  tg?: string[]

  // organizations
  org?: string[]

  // date_start
  start?: string
}
