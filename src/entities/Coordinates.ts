export default class Coordinates {
  public longitude!: number
  public latitude!: number

  constructor(data: Coordinates) {
    this.longitude = data.longitude || 0
    this.latitude = data.latitude || 0
  }
}
