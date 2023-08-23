import CRUD from './CRUD'
import Trajectory from '@/entities/Trajectory'

export class TrajectoryDateAPI extends CRUD<string> {
  constructor() {
    super('/v1/trajectories/dates')
  }
}

export default new TrajectoryDateAPI()
