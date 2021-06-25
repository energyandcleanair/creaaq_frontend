import Target from '@/entities/Target'
import CRUD from './CRUD'

export class TargetAPI extends CRUD<Target> {
  constructor () {
    super('/targets')
  }
}

export default new TargetAPI()
