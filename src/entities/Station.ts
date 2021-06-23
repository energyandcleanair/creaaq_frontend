import City from './City'

export default class Station {
  public id!: string
  public label!: string
  public cityId!: City['id']

  public city?: City
  public _measurementsNumber?: number

  constructor (data: Station) {
    Object.assign(this, data)
  }
}
