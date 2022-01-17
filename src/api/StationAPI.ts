import City from '@/entities/City'
import Station from '@/entities/Station'
import CRUD from './CRUD'

export class StationAPI extends CRUD<Station> {
  constructor() {
    super('/stations')
  }
}

export interface StationQueryFindAll {
  city?: City['id'][]
  format?: 'json' | 'scv'
}

export default new StationAPI()
