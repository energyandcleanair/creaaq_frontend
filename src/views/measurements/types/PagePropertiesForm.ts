import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import ChartDisplayModes from '../components/MeasurementsChart/ChartDisplayModes'
import ChartColumnSize from './ChartColumnSize'

export default interface PagePropertiesForm {
  displayMode: ChartDisplayModes
  runningAverage: string
  chartColumnSize: ChartColumnSize
  sources: Source[]
  visibleSources: Source['id'][]
  pollutants: Pollutant[]
  visiblePollutants: Pollutant['id'][]
  isShowStations: boolean
  stationsDisplayOptions: any
}