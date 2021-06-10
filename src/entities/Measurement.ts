import Country from './Country'
import City from './City'
import Pollutant from './Pollutant'
import Source from './Source'

export enum MeasurementProcesses {
  city_day_mad = 'city_day_mad',
  station_day_mad = 'station_day_mad',
}

// TODO: approve the schema
export default class Measurement {
  public id!: string
  public name!: string
  public country_id!: Country['id']
  public location_id!: City['id']
  public city_id!: City['id']
  public source!: Source['id']
  public date!: string|Date
  public level!: 'city'
  public value!: number

  public unit?: string
  public pollutant?: Pollutant['id']
  public names?: string[]|null
  public gpw?: any
  public timezone?: string
  public process_id?: MeasurementProcesses
  public gadm1_id?: string
  public name_local?: string|null
  public geometry?: {
    longitude: number
    latitude: number
  }

  constructor (data: Measurement) {
    Object.assign(this, data)
  }
}
