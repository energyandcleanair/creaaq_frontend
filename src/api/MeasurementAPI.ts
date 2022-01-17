import City from '@/entities/City'
import Measurement, {MeasurementProcesses} from '@/entities/Measurement'
import CRUD from './CRUD'

export class MeasurementAPI extends CRUD<Measurement> {
  constructor() {
    super('/measurements')
  }
}

export interface MeasurementQueryFindAll {
  city: City['id'][]
  date_from?: string
  date_to?: string
  process?: MeasurementProcesses[]
  sort_by?: ('asc(location_id)' | 'asc(pollutant)' | 'asc(date)' | string)[]
  format?: 'json' | 'scv'
}

export default new MeasurementAPI()
