import moment from 'moment'
import Country from '@/types/Country'
import City from '@/types/City'
import Source from '@/types/Source'
import Pollutant from '@/types/Pollutant'

export default class MeasurementsQuery {
  public cities!: City[]
  public countries!: Country[]
  public sources!: Source[]
  public pollutants?: Pollutant[]
  public dateStart!: number
  public dateEnd?: number

  static toQueryString (query: MeasurementsQuery): string {
    const searchParams = new URLSearchParams()

    if (query.cities?.length) {
      searchParams.append(
        'city',
        query.cities.map(i => i.name).join(',')
      )
    }
    if (query.pollutants?.length) {
      searchParams.append(
        'pollutant',
        query.pollutants.map(i => i.id).join(',')
      )
    }
    if ((query.dateStart || 0) > 0) {
      searchParams.append('date_from', moment(query.dateStart).format('YYYY-MM-DD'))
    }
    if ((query.dateEnd || 0) > 0 && query.dateStart !== query.dateStart) {
      searchParams.append('date_to', moment(query.dateEnd).format('YYYY-MM-DD'))
    }

    return searchParams.toString()
  }
}
