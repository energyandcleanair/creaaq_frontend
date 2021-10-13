import City from './City'
import Organization from './Organization'
import Pollutant from './Pollutant'

export default class Target {
  public id!: string
  public name!: string
  public cityId!: City['id']
  public location_id!: City['id']
  public organization!: Organization['id']
  public pollutant!: Pollutant['id']
  public guideline?: string
  public short_name!: string

  public target_unit?: string

  public _violationsNumber?: number

  constructor(data: Target) {
    Object.assign(this, data)
  }
}
