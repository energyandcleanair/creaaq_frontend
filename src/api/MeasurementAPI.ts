import Measurement from '@/types/Measurement'
import CRUD from './CRUD'

export class MeasurementAPI extends CRUD<Measurement> {
  constructor () {
    super('/measurements')
  }
}

export default new MeasurementAPI()
