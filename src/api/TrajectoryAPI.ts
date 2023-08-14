import CRUD from './CRUD'
import Trajectory from '@/entities/Trajectory'

export class TrajectoryAPI extends CRUD<Trajectory> {
  constructor() {
    super('/v1/trajectories')
  }
}

export default new TrajectoryAPI()
