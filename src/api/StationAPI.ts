import Station from '@/entities/Station'
import CRUD from './CRUD'

export class StationAPI extends CRUD<Station> {
  constructor () {
    super('/stations')
  }
}

export default new StationAPI()
