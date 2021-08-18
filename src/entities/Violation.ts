import Country from './Country'
import City from './City'
import Pollutant from './Pollutant'
import Source from './Source'
import Organization from './Organization'
import Target from './Target'

export enum MeasurementProcesses {
  city_day_mad = 'city_day_mad',
  station_day_mad = 'station_day_mad',
}

export enum MeasurementLevels {
  city = 'city',
}

// TODO: approve the schema
export default class Violation {
  public id!: string
  public name!: string
  public country_id!: Country['id']
  public location_id!: City['id']
  public city_id!: City['id']
  public target_id!: Target['id']
  public source!: Source['id']
  public date!: string | Date
  public pollutant!: Pollutant['id']
  public level!: MeasurementLevels
  public value!: number

  public target_value?: number
  public unit?: string
  public organization?: Organization['id']
  public names?: string[] | null
  public gpw?: any
  public timezone?: string
  public process_id?: MeasurementProcesses
  public gadm1_id?: string
  public name_local?: string | null
  public geometry?: {
    longitude: number
    latitude: number
  }

  constructor(data: Violation) {
    Object.assign(this, data)
  }
}
