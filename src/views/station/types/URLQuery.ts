import City from '@/entities/City'
import Country from '@/entities/Country'
import Station from '@/entities/Station'

export default interface URLQuery {
  cities: City['id'][]
  stations: Station['id'][]
}
