import Pollutant from '@/entities/Pollutant'
import CRUD from './CRUD'

export class PollutantAPI extends CRUD<Pollutant> {
  constructor() {
    super('/pollutants')
  }
}

export default new PollutantAPI()
