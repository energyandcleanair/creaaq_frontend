import moment from 'moment'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'
import ChartDisplayModes from './ChartDisplayModes'

export default class MeasurementsQuery {
  public cities!: City[]
  public dateStart!: number
  public dateEnd?: number
  public sources?: Source[]
  public pollutants?: Pollutant[]
  public displayMode?: ChartDisplayModes

  static toQueryString (query: MeasurementsQuery): string {
    const searchParams = new URLSearchParams()

    if (query.cities?.length) {
      searchParams.append(
        'city',
        query.cities.map(i => i.id).join(',')
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
    if ((query.dateEnd || 0) > 0 && query.dateStart !== query.dateEnd) {
      searchParams.append('date_to', moment(query.dateEnd).format('YYYY-MM-DD'))
    }

    return searchParams.toString()
  }
}
