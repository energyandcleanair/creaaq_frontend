import Measurement from '@/entities/Measurement'
import CRUD from './CRUD'

export class MeasurementAPI extends CRUD<Measurement> {
  constructor() {
    super('/measurements')
  }
}

export default new MeasurementAPI()
