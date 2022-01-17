import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'
import RunningAverageEnum from '@/entities/RunningAverageEnum'
import ChartDisplayModes from '../components/MeasurementsChart/ChartDisplayModes'
import ChartColsNum from '../components/MeasurementsChart/ChartColsNum'

export type yyyymmdd = string

enum URLQueryStations {
  all = 'all',
}
export {URLQueryStations}

export default interface URLQuery {
  cities: City['id'][]
  sources: Source['id'][]
  pollutants: Pollutant['id'][]
  stations?: Station['id'][] | URLQueryStations.all[]
  date_start?: yyyymmdd
  date_end?: yyyymmdd
  display_mode?: ChartDisplayModes
  running_average?: RunningAverageEnum
  chart_cols?: ChartColsNum | 0
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
  start?: yyyymmdd

  // date_end
  end?: yyyymmdd

  // display_mode
  dspl?: string

  // running_average
  avg?: string

  // chart_cols
  cols?: string
}
