import {MetaData} from './MetaData'

export default class Raster {
  public name!: string
  public url!: string
  public file_path!: string

  public metadata!: MetaData

  constructor(data: Raster) {
    Object.assign(this, data)
  }
}
