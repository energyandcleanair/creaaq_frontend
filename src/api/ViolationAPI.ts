import Violation from '@/entities/Violation'
import CRUD from './CRUD'

export class ViolationAPI extends CRUD<Violation> {
  constructor () {
    super('/violations')
  }
}

export default new ViolationAPI()
