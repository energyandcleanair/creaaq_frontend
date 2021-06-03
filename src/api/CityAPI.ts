import City from '@/entities/City'
import CRUD from './CRUD'

export class CityAPI extends CRUD<City> {
  constructor () {
    super('/cities')
  }
}

export default new CityAPI()
