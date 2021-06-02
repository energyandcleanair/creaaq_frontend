export default class Pollutant {
  public label!: string
  public value!: string

  // TODO: add props
  public id?: string

  constructor (data: Pollutant) {
    Object.assign(this, data)
  }
}
