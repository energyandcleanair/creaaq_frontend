import Country from './Country'

export default class Regulation {
  public id!: string
  public name!: string
  public country!: Country['id'][]

  public comment?: string | null
  public link?: string | null
  public location_id?: string | null
  public organization?: string | null

  // public _violationsNumber?: number

  constructor(data: Regulation) {
    Object.assign(this, data)
  }
}
