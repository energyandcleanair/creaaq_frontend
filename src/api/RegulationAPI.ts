import Regulation from '@/entities/Regulation'
import CRUD from './CRUD'

export class RegulationAPI extends CRUD<Regulation> {
  constructor() {
    super('/regulations')
  }
}

export default new RegulationAPI()
