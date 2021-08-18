import Country from './Country'

// TODO: approve the schema
export default class City {
  public id!: string
  public name!: string
  public country_id!: Country['id']
  public country_name!: Country['name']
  public level!: 'city'

  public names?: string[] | null
  public gpw?: any
  public timezone?: string
  public gadm1_id?: string
  public name_local?: string | null
  public geometry?: {
    longitude: number
    latitude: number
  }

  constructor(data: City) {
    Object.assign(this, data)
  }
}
