export default class Country {
  public id!: string
  public name!: string

  // TODO: add props

  constructor (data: Country) {
    Object.assign(this, data)
  }
}
