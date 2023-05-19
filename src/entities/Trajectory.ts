interface TrajectoryFeature {
    geometry: {
        coordinates: [number, number][]
    }
}

export default class Trajectory {
    public id!: string

    public features!: TrajectoryFeature[]
  
    constructor(data: Trajectory) {
      Object.assign(this, data)
    }
  }
  