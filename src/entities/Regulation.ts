import Country from './Country'

export default class Regulation {
  public id!: string
  public name!: string
  public country!: Country['id'][]

  public short_name?: string | null
  public comment?: string | null
  public link?: string | null
  public location_id?: string | null
  public organization?: string | null

  constructor(data: Regulation) {
    Object.assign(this, data)
  }
}
