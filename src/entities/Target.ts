import City from './City'

export default class Target {
  public id!: string
  public name!: string
  public cityId!: City['id']

  public _violationsNumber?: number

  constructor (data: Target) {
    Object.assign(this, data)
  }
}
