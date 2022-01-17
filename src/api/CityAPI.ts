import City from '@/entities/City'
import CRUD from './CRUD'

export class CityAPI extends CRUD<City> {
  constructor() {
    super('/cities')
  }
}

export interface CityQueryFindAll {
  id: City['id'][]
  format?: 'json' | 'scv'
}

export default new CityAPI()
