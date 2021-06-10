import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import Station from '@/entities/Station'
import ChartDisplayModes from '../components/MeasurementsChart/ChartDisplayModes'
import ChartColumnSize from './ChartColumnSize'

export default interface PagePropertiesForm {
  displayMode: ChartDisplayModes
  runningAverage: string
  chartColumnSize: ChartColumnSize|0
  cities: City[]
  sources: Source[]
  visibleSources: Source['id'][]
  pollutants: Pollutant[]
  visiblePollutants: Pollutant['id'][]
  stations: Station[]
  visibleStations: Station['id'][]
}