export default class Pollutant {
  public id!: string
  public name!: string

  constructor(data: Pollutant) {
    Object.assign(this, data)
  }
}
