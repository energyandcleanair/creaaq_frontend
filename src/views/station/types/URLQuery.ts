import City from '@/entities/City'
import Station from '@/entities/Station'

export default interface URLQuery {
  cities: City['id'][]
  stations: Station['id'][]
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // stations
  st?: string[]
}
