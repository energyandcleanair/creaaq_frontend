import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'
import ChartDisplayModes from '../components/MeasurementsChart/ChartDisplayModes'
import ChartColumnSize from './ChartColumnSize'
import RunningAverageEnum from './RunningAverageEnum'

enum URLQueryStations {
  all = 'all',
}
export {
  URLQueryStations
}

export default interface URLQuery {
  cities: City['id'][]
  sources: Source['id'][]
  pollutants: Pollutant['id'][]
  stations?: Station['id'][]|URLQueryStations.all[]
  date_start?: string
  date_end?: string
  display_mode?: ChartDisplayModes
  running_average?: RunningAverageEnum
  chart_cols?: ChartColumnSize|0
}