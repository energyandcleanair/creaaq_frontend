import Source from '@/entities/Source'
import CRUD from './CRUD'

export class SourceAPI extends CRUD<Source> {
  constructor() {
    super('/sources')
  }
}

export default new SourceAPI()
