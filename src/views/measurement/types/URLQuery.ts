import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'
import ChartDisplayModes from '../components/MeasurementsChart/ChartDisplayModes'
import ChartColumnSize from '../components/MeasurementsChart/ChartColumnSize'
import RunningAverageEnum from './RunningAverageEnum'

enum URLQueryStations {
  all = 'all',
}
export {URLQueryStations}

export default interface URLQuery {
  cities: City['id'][]
  sources: Source['id'][]
  pollutants: Pollutant['id'][]
  stations?: Station['id'][] | URLQueryStations.all[]
  date_start?: string
  date_end?: string
  display_mode?: ChartDisplayModes
  running_average?: RunningAverageEnum
  chart_cols?: ChartColumnSize | 0
  need_reload?: boolean
}

export interface URLQueryRaw {
  // cities
  ct?: string[]

  // sources
  sr?: string[]

  // pollutants
  pl?: string[]

  // stations
  st?: string[]

  // date_start
  start?: string

  // date_end
  end?: string

  // display_mode
  dspl?: string

  // running_average
  avg?: string

  // chart_cols
  cols?: string

  // need_reload
  need_rld?: string
}
