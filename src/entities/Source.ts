import City from './City'
import {MeasurementLevels} from './Measurement'

export default class Source {
  public id!: string
  public name!: string
  public short_name?: string
  public url?: string
  // public cityId!: City['id']
  // public level!: MeasurementLevels

  // public city?: City
  // public _measurementsNumber?: number

  constructor(data: Source) {
    Object.assign(this, data)
  }
}
