import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
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
}

export interface URLQueryRaw {
  // level
  lvl?: string

  // basemap
  bmap?: string
}
