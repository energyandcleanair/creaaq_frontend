export default class Pollutant {
  public id!: string
  public label!: string
  public unit?: string

  constructor (data: Pollutant) {
    Object.assign(this, data)
  }
}