export default class Raster {
  public name!: string
  public url!: string
  public file_path!: string

  constructor(data: Raster) {
    Object.assign(this, data)
  }
}
