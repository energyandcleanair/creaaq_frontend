import City from './City'
import Country from './Country'
import Pollutant from './Pollutant'
import Source from './Source'

export interface Coordinates {
  latitude: number
  longitude: number
}

export default class Station {
  public id!: string
  public name!: string
  public city_id!: City['id']
  public country_id!: Country['id']

  public city_name?: City['name']
  public source?: Source['id']
  public names?: string[]
  public type?: string | null
  public city?: City
  public coordinates?: Coordinates
  public attribution?: string | null
  public pollutants?: Pollutant['id'][]
  public last_updated?: string | Date
  public _measurementsNumber?: number

  constructor(data: Station) {
    Object.assign(this, data)
  }
}
