import Source from '@/entities/Source'
import ChartColumnSize from './ChartColumnSize'

export default interface PagePropertiesForm {
  runningAverage: string
  chartColumnSize: ChartColumnSize
  sources: Source['id'][]
  pollutants: {
    [id: string]: boolean
  }
  isShowStations: boolean
  stationsDisplayOptions: any
}