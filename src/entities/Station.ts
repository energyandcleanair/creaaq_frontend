import City from './City'
import Coordinates from './Coordinates'
import Country from './Country'
import Pollutant from './Pollutant'
import Source from './Source'

export default class Station {
  public id!: string
  public name!: string
  public city_id!: City['id']
  public country_id!: Country['id']

  public level?: 'station'
  public city_name?: City['name']
  public source?: Source['id']
  public names?: string[]
  public type?: string | null
  public city?: City
  public coordinates?: Coordinates
  public attribution?: string | null
  public pollutants?: Pollutant['id'][]
  public last_updated?: string | Date

  public _source?: Source
  public _pollutants?: Pollutant[]
  public _getSourceColor?: (station?: Station) => string | undefined

  constructor(data: Station) {
    Object.assign(this, data)
  }
}
