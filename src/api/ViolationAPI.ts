import City from '@/entities/City'
import Violation from '@/entities/Violation'
import CRUD from './CRUD'

export class ViolationAPI extends CRUD<Violation> {
  constructor() {
    super('/violations')
  }
}

export interface ViolationQueryFindAll {
  city: City['id'][]
  date_from?: string
  date_to?: string
  sort_by?: ('asc(location_id)' | 'asc(pollutant)' | 'asc(date)' | string)[]
  format?: 'json' | 'scv'
}

export default new ViolationAPI()
