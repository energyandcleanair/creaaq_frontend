import City from './City'

export default class Country {
  public id!: string
  public name!: string

  public _cities?: City[]

  constructor(data: Country) {
    Object.assign(this, data)
  }
}
