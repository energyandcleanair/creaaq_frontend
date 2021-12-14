import City from '@/entities/City'
import Station from '@/entities/Station'

export default interface URLQuery {
  cities: City['id'][]
  stations: Station['id'][]
  need_reload?: boolean
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // stations
  st?: string[]

  // need_reload
  need_rld?: string
}
