import moment from 'moment'
import City from '@/entities/City'

export default class ViolationsQueryForm {
  public cities!: City[]
  public dateStart?: number
  public sortBy?: string

  static toQueryString (query: ViolationsQueryForm): string {
    const searchParams = new URLSearchParams()

    if (query.cities?.length) {
      searchParams.append(
        'city',
        query.cities.map(i => i.id).join(',')
      )
    }
    if ((query.dateStart || 0) > 0) {
      searchParams.append('date_from', moment(query.dateStart).format('YYYY-MM-DD'))
    }
    if (query.sortBy) {
      searchParams.append('sort_by', query.sortBy)
    }

    return searchParams.toString()
  }
}
