import City from './City'

export default class Organization {
  public id!: string
  public name!: string
  public cityId!: City['id']

  public _violationsNumber?: number

  constructor(data: Organization) {
    Object.assign(this, data)
  }
}
