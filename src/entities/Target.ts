import City from './City'
import Pollutant from './Pollutant'
import Regulation from './Regulation'

export default class Target {
  public id!: string
  public name!: string
  public location_id!: City['id']
  public pollutant!: Pollutant['id']
  public regulation_id?: Regulation['id']

  public target_unit?: string

  public _violationsNumber?: number

  constructor(data: Target) {
    Object.assign(this, data)
  }
}
