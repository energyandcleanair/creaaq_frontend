import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'

export enum MapChartLevel {
  city = 'city',
  station = 'station',
}

export enum MapChartBasemap {
  satellite = 'satellite',
  terrain = 'terrain',
}

export default interface URLQuery {
  level?: MapChartLevel
  basemap?: MapChartBasemap
  pollutants?: Pollutant['id'][]
  cities?: City['id'][]
  stations?: Station['id'][]
  sources?: Source['id'][]
}

export interface URLQueryRaw {
  // level
  lvl?: string

  // basemap
  bmap?: string

  // pollutants
  pl?: string[]

  // sources
  sr?: string[]
}
