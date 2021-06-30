import City from '@/entities/City'
import Country from '@/entities/Country'
import Station from '@/entities/Station'

export default interface ChartData {
  countries: Country[]
  cities: City[]
  stations: Station[]
}