import City from '@/entities/City'

export default interface URLQuery {
  cities: City['id'][]
  dateFrom: string
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // stations
  dateFrom?: string
}
