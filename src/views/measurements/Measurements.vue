<template>
<div class="view-measurements fill-height" style="overflow: auto;">
  <v-container class="pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" md="5" lg="6" xl="6">
        <SelectBox
          v-model="queryForm.cities"
          :label="$t('cities')"
          :items="cities"
          :disabled="isLoading"
          :filter="citiesInputFilter"
          item-text="name"
          item-value="id"
          return-object
          hide-details
          has-deselect-all
          @input="onChangeQueryForm('cities')"
        >
          <template v-slot:item-subtext="{item}">
            <CountryFlag
              :country="(item.country_id || '').toLowerCase()"
              size="small"
            />
            <span class="grey--text text--base">
              &nbsp;&nbsp;{{ item.country_name }}
            </span>
          </template>
        </SelectBox>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <DatesIntervalInput
          :dateStart="queryForm.dateStart"
          :dateEnd="queryForm.dateEnd"
          format="YYYY-MM-DD"
          :disabled="isLoading"
          @input="($e) => {
            queryForm.dateStart = $e.dateStart;
            queryForm.dateEnd = $e.dateEnd;
            onChangeQueryForm()
          }"
        />
      </v-col>

      <v-col
        class="d-flex justify-end justify-md-start align-center"
        cols="12"
        sm="6"
        md="2"
        offset-md="1"
        offset-lg="0"
      >
        <v-btn
          class="ml-3"
          :disabled="isLoading"
          :loading="isLoading || isChartLoading"
          @click="onClickRefresh"
          color="primary"
          small
        >
          {{ $t('refresh') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <v-container class="mt-4 px-8" fluid>
    <MeasurementsRightDrawer
      :formData="pageProperties"
      :open.sync="isRightPanelOpen"
      @update:formData="onChangePageProperties"
    />

    <MeasurementsChart
      ref="measurementsChart"
      :chartData="chartData"
      :cols.sync="chartCols"
      :displayMode="displayMode"
      :runningAverage="runningAverage"
      :displayStations="true"
      :filterSources="filterSources"
      :filterPollutants="filterPollutants"
      :filterStations="filterStations"
      :loading="isChartLoading"
    />
  </v-container>
</div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _orderBy from 'lodash.orderby'
import CountryFlag from 'vue-country-flag'
import { Component, Vue, Ref } from 'vue-property-decorator'
import { mdiCalendar } from '@mdi/js'
import { ModuleState } from '@/store'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'
import Measurement, { MeasurementProcesses } from '@/entities/Measurement'
import POLLUTANTS from '@/constants/pollutants.json'
import CityAPI from '@/api/CityAPI'
import MeasurementAPI from '@/api/MeasurementAPI'
import SelectBox from './components/SelectBox.vue'
import DatesIntervalInput from './components/DatesIntervalInput/DatesIntervalInput.vue'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import MeasurementsQuery from './components/MeasurementsChart/MeasurementsQuery'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'
import ChartComponentData from './components/MeasurementsChart/ChartComponentData'
import MeasurementsRightDrawer from './components/MeasurementsRightDrawer.vue'
import PagePropertiesForm from './types/PagePropertiesForm'
import ChartColumnSize from './types/ChartColumnSize'
import RunningAverageEnum from './types/RunningAverageEnum'

const QUERY_DATE_FORMAT = 'YYYY-MM-DD'
type QueryDateString = typeof QUERY_DATE_FORMAT|string
const _toStringDate = (d: string|number): string => typeof d === 'string'
  ? d === '0' ? '0' : moment(d, QUERY_DATE_FORMAT).format(QUERY_DATE_FORMAT)
  : d === 0 ? '0' : moment(+d).format(QUERY_DATE_FORMAT)
const _toNumberDate = (d: string): number => d === '0'
  ? 0
  : moment(d, QUERY_DATE_FORMAT).valueOf()
const today: string = _toStringDate(moment().format(QUERY_DATE_FORMAT))

interface URLQuery {
  cities: City['id'][]
  sources: Source['id'][]
  pollutants: Pollutant['id'][]
  stations?: Station['id'][]
  date_start?: QueryDateString
  date_end?: QueryDateString
  display_mode?: ChartDisplayModes
  running_average?: RunningAverageEnum
  chart_cols?: ChartColumnSize|0
}

const DEFAUL_DISPLAY_MODE = ChartDisplayModes.NORMAL
const DEFAUL_RUNNING_AVERAGE = RunningAverageEnum['1d']

@Component({
  components: {
    MeasurementsRightDrawer,
    DatesIntervalInput,
    SelectBox,
    MeasurementsChart,
    CountryFlag,
  }
})
export default class ViewMeasurements extends Vue {
  @Ref('measurementsChart') $measurementsChart?: MeasurementsChart
  private cities: City[] = []
  private mdiCalendar = mdiCalendar
  private isLoading: boolean = false
  private isChartLoading: boolean = false
  private isMenuDateStartOpen: boolean = false
  private isMenuDateEndOpen: boolean = false

  private chartData: ChartComponentData = {
    dateStart: 0,
    dateEnd: 0,
    cities: [],
    measurements: [],
    pollutants: [],
    sources: [],
    stations: [],
  }

  private queryForm: MeasurementsQuery = {
    cities: [],
    dateStart: _toNumberDate(today),
    dateEnd: _toNumberDate(today),
  }

  private pageProperties: PagePropertiesForm = {
    displayMode: DEFAUL_DISPLAY_MODE,
    runningAverage: DEFAUL_RUNNING_AVERAGE,
    chartColumnSize: 12,
    cities: [],
    sources: [],
    visibleSources: [],
    pollutants: [],
    visiblePollutants: [],
    stations: [],
    visibleStations: [],
  }

  private get DISPLAY_MODES (): any {
    return Object.values(ChartDisplayModes)
      .reduce((memo: any[], val) => {
        memo.push({
          label: this.$t(val.toLowerCase() || '').toString(),
          value: val,
        })
        return memo
      }, [])
  }

  private get urlQuery (): URLQuery {
    const q = this.$route.query

    const cities = Array.isArray(q.cities) ? q.cities : [q.cities]
    const sources = Array.isArray(q.sources) ? q.sources : [q.sources]
    const pollutants = Array.isArray(q.pollutants) ? q.pollutants : [q.pollutants]
    const stations = Array.isArray(q.stations) ? q.stations : [q.stations]
    const date_start = q.date_start
      ? _toStringDate(q.date_start as string)
      : ''
    const date_end = q.date_end
      ? _toStringDate(q.date_end as string)
      : ''

    return {
      cities: cities.filter(i => i) as City['id'][],
      sources: sources.filter(i => i) as Source['id'][],
      pollutants: pollutants.filter(i => i) as Pollutant['id'][],
      stations: stations.filter(i => i) as Station['id'][],
      date_start,
      date_end,
      chart_cols: (Number(q.chart_cols) || 0) as ChartColumnSize,
      running_average: q.running_average as RunningAverageEnum || undefined,
      display_mode: q.display_mode
        ? (String(q.display_mode) || '').toUpperCase() as ChartDisplayModes
        : undefined,
    }
  }

  private set urlQuery (queryForm: URLQuery) {
    const query: URLQuery = {
      ...queryForm,
    }
    const date_start = queryForm.date_start
      ? _toStringDate(queryForm.date_start)
      : ''
    const date_end = queryForm.date_end
      ? _toStringDate(queryForm.date_end)
      : ''

    if (date_start) query.date_start = date_start
    if (date_end) query.date_end = date_end

    const newPath = this.$router.resolve({
      ...(this.$route as any),
      query
    }).href

    this.$store.commit('SET', {key: 'queryForm.cities', value: query.cities})
    this.$store.commit('SET', {key: 'queryForm.dateStart', value: date_start})
    this.$store.commit('SET', {key: 'queryForm.dateEnd', value: date_end})

    if (this.$route.fullPath !== newPath) this.$router.replace(newPath)
  }

  private get filterSources (): Source['id'][] {
    return this.pageProperties.visibleSources || []
  }

  private get filterPollutants (): Pollutant['id'][] {
    return this.pageProperties.visiblePollutants || []
  }

  private get filterStations (): Station['id'][] {
    return this.pageProperties.visibleStations || []
  }

  private get displayMode (): ChartDisplayModes|null {
    return this.pageProperties.displayMode || null
  }

  private get runningAverage (): RunningAverageEnum|null {
    return this.pageProperties.runningAverage || null
  }

  private get chartCols (): ChartColumnSize|0 {
    return this.pageProperties.chartColumnSize || 0
  }

  private set chartCols (cols: ChartColumnSize|0) {
    this.pageProperties.chartColumnSize = cols
    this.urlQuery = {
      ...this.urlQuery,
      chart_cols: cols
    }
  }

  private get isRightPanelOpen (): boolean {
    return this.$store.getters.GET('ui.measurements.isRightPanelOpen')
  }
  private set isRightPanelOpen (value: boolean) {
    this.$store.commit('SET', {key: 'ui.measurements.isRightPanelOpen', value})
  }

  private get queryFormCached (): ModuleState['queryForm']|null {
    return this.$store.getters.GET('queryForm') || null
  }

  private get dateStartFormat (): string {
    return moment(this.queryForm.dateStart).format('YYYY-MM-DD')
  }

  private get dateEndFormat (): string {
    return moment(this.queryForm.dateEnd).format('YYYY-MM-DD')
  }

  private async beforeMount () {
    this.isLoading = true
    await this.fetch()
    this.isLoading = false
  }

  private async fetch () {
    this.$loader.on()
    this.isChartLoading = true

    this.setQueryFormDefaults()

    const cities = await this.fetchCities()
    this.cities = cities

    if (!this.urlQuery.cities.length &&
      this.queryFormCached?.cities.length) {

      this.urlQuery = {
        ...this.urlQuery,
        cities: this.queryFormCached?.cities || []
      }
    }

    if (this.urlQuery.cities.length) {
      const idsMap = this.urlQuery.cities
        .reduce((memo: {[id: string]: number}, id: City['id']) => {
          memo[id] = 1
          return memo
        }, {})

      this.queryForm.cities = this.cities
        .filter(city => idsMap[city.id])

      this.urlQuery = {
        ...this.urlQuery,
        cities: this.queryForm.cities.map(i => i.id)
      }
    } else if (this.cities[0]) {
      this.queryForm.cities = [this.cities[0]]
      this.urlQuery = {
        ...this.urlQuery,
        cities: [this.cities[0].id]
      }
    }

    await this.refreshChartData()

    this.isChartLoading = false
    this.$loader.off()
  }

  private setQueryFormDefaults (): void {
    const pageProperties = {...this.pageProperties}
    const urlQuery = {...this.urlQuery}
    const queryForm = {...this.queryForm}

    if (!urlQuery.chart_cols) {
      urlQuery.chart_cols = MeasurementsChart.getDefaultChartCols(this.$vuetify)
    }

    if (urlQuery.date_start || urlQuery.date_start === '0') {
      queryForm.dateStart = _toNumberDate(urlQuery.date_start)
    } else {
      if (!queryForm.dateStart) queryForm.dateStart = _toNumberDate(today)
      urlQuery.date_start = _toStringDate(queryForm.dateStart)
    }

    if (urlQuery.date_end || urlQuery.date_end === '0') {
      queryForm.dateEnd = _toNumberDate(urlQuery.date_end)
    } else {
      if (!queryForm.dateEnd) queryForm.dateEnd = _toNumberDate(today)
      urlQuery.date_end = _toStringDate(queryForm.dateEnd)
    }

    pageProperties.chartColumnSize = urlQuery.chart_cols as ChartColumnSize

    if (urlQuery.display_mode) {
      pageProperties.displayMode = urlQuery.display_mode
    } else if (!pageProperties.displayMode) {
      pageProperties.displayMode = DEFAUL_DISPLAY_MODE
    }

    if (urlQuery.running_average) {
      pageProperties.runningAverage = urlQuery.running_average
    } else if (!pageProperties.runningAverage) {
      pageProperties.runningAverage = DEFAUL_RUNNING_AVERAGE
    }

    if (urlQuery.sources?.length) {
      pageProperties.visibleSources = urlQuery.sources
    }
    if (urlQuery.pollutants?.length) {
      pageProperties.visiblePollutants = urlQuery.pollutants
    }
    if (urlQuery.stations?.length) {
      pageProperties.visibleStations = urlQuery.stations
    }

    Object.assign(this.pageProperties, pageProperties)
    Object.assign(this.urlQuery, urlQuery)
    Object.assign(this.queryForm, queryForm)
  }

  private async fetchCities (): Promise<City[]> {
    const [err, cities] = await to(CityAPI.findAll())
    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return _orderBy(cities || [], 'name')
  }

  private async fetchChartData (): Promise<ChartComponentData> {
    let dateStart = this.queryForm.dateStart

    // shift the queried 'from' date by 1 year ago
    // so the running average display well
    if ((dateStart || 0) > 0) {
      const _date = moment(dateStart)
      dateStart = +_date.year(_date.year() - 1)
    }

    const promise_measurementsByCities = this.fetchMeasurements({
      ...this.queryForm,
      dateStart,
      process: MeasurementProcesses.city_day_mad,
      sortBy: 'asc(pollutant),asc(date)'
    })

    const promise_measurementsByStations = this.fetchMeasurements({
      ...this.queryForm,
      dateStart,
      process: MeasurementProcesses.station_day_mad,
      sortBy: 'asc(pollutant),asc(date)'
    })

    const [err, arrays] = await to<Measurement[][]>(Promise.all([
      promise_measurementsByCities,
      promise_measurementsByStations,
    ]))

    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const measurementsByCities = arrays?.[0] || []
    const measurementsByStations = arrays?.[1] || []
    const measurements = measurementsByCities.concat(measurementsByStations)

    const pollutantsMap = measurementsByCities
      .reduce((memo: {[pollutantId: string]: Pollutant}, meas: Measurement) => {
        if (meas.pollutant && !memo[meas.pollutant]) {
          const pollutant = POLLUTANTS.find(i => i.id === meas.pollutant)
          if (pollutant) {
            memo[meas.pollutant] = {...pollutant, unit: meas.unit}
          } else {
            console.warn(`Unknown pollutant: ${meas.pollutant}`)
          }
        }
        return memo
      }, {})
    const pollutants = _orderBy(Object.values(pollutantsMap), 'id')

    const sourcesMap = measurementsByCities
      .reduce((memo: {[sourceId: string]: Source}, meas: Measurement) => {
        if (!meas.source) return memo
        if (memo[meas.source]) {
          memo[meas.source]._measurementsNumber = 1 + (memo[meas.source]?._measurementsNumber || 0)
        } else {
          memo[meas.source] = {
            id: meas.source,
            label: meas.source,
            cityId: meas.city_id,
            level: meas.level,
            _measurementsNumber: 0,
          }
        }
        return memo
      }, {})
    const sources = _orderBy(Object.values(sourcesMap), 'id')

    const stationsMap = measurementsByStations
      .reduce((memo: {[stationId: string]: Station}, meas: Measurement) => {
        if (!meas.source) return memo
        if (memo[meas.location_id]) {
          memo[meas.location_id]._measurementsNumber = 1 + (memo[meas.location_id]?._measurementsNumber || 0)
        } else {
          memo[meas.location_id] = {
            id: meas.location_id,
            label: meas.location_id,
            cityId: meas.city_id,
            _measurementsNumber: 0,
          }
        }
        return memo
      }, {})
    const stations = _orderBy(Object.values(stationsMap), 'id')

    const chartData = {
      dateStart: this.queryForm.dateStart || 0,
      dateEnd: this.queryForm.dateEnd || 0,
      cities: this.queryForm.cities.slice(),
      measurements: measurements,
      pollutants: pollutants,
      sources: sources,
      stations: stations,
    }
    return chartData
  }

  private async refreshChartData (): Promise<void> {
    this.isChartLoading = true

    const chartData = await this.fetchChartData()
    this.chartData = chartData
    this.pageProperties.cities = this.chartData.cities || []
    this.pageProperties.sources = this.chartData.sources || []
    this.pageProperties.pollutants = this.chartData.pollutants || []
    this.pageProperties.stations = this.chartData.stations || []

    let visibleSources = this.pageProperties.visibleSources
      .filter(srcId => this.pageProperties.sources.find((s) => s.id === srcId))

    // automatically select the source with the most measurements in city-level
    if (!visibleSources.length) {
      const defaultSource = this.chooseDefaultSource(this.pageProperties.sources)
      visibleSources = defaultSource ? [defaultSource.id] : []
    }
    this.pageProperties.visibleSources = visibleSources

    let visiblePollutants = this.pageProperties.visiblePollutants
      .filter(pollId => this.pageProperties.pollutants.find((p) => p.id === pollId))
    if (!visiblePollutants.length) {
      visiblePollutants = this.pageProperties.pollutants.map(i => i.id)
    }
    this.pageProperties.visiblePollutants = visiblePollutants

    const visibleStations = this.pageProperties.visibleStations
      .filter(statId => this.pageProperties.stations.find((s) => s.id === statId))
    this.pageProperties.visibleStations = visibleStations

    this.urlQuery = {
      ...this.urlQuery,
      sources: visibleSources,
      pollutants: visiblePollutants,
      stations: visibleStations,
    }

    this.isChartLoading = false
  }

  private async fetchMeasurements (query: MeasurementsQuery): Promise<Measurement[]> {
    const q: string = MeasurementsQuery.toQueryString(query)

    const [err, measurements] = await to(MeasurementAPI.findAll(q))
    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return measurements || []
  }

  private onChangeQueryForm (fieldName?: keyof MeasurementsQuery) {
    this.urlQuery = {
      ...this.urlQuery,
      cities: this.queryForm.cities.map(i => i.id),
      date_start: _toStringDate(this.queryForm.dateStart || 0),
      date_end: _toStringDate(this.queryForm.dateEnd || 0),
    }
  }

  private onChangePageProperties (data: PagePropertiesForm) {
    this.pageProperties = {...data}
    this.urlQuery = {
      ...this.urlQuery,
      chart_cols: data.chartColumnSize,
      sources: data.visibleSources,
      pollutants: data.visiblePollutants,
      stations: data.visibleStations,
      display_mode: data.displayMode ===  DEFAUL_DISPLAY_MODE
        ? undefined
        : data.displayMode,
      running_average: data.runningAverage === DEFAUL_RUNNING_AVERAGE
        ? undefined
        : data.runningAverage,
    }
  }

  private async onClickRefresh () {
    this.$loader.on()

    const oldIds = [...this.urlQuery.cities]
      .sort((a, b) => a.localeCompare(b))
      .join(',')
    const newIds = [...this.queryForm.cities]
      .map(i => i.id)
      .sort((a, b) => a.localeCompare(b))
      .join(',')

    if (oldIds !== newIds) {
      this.onChangePageProperties({
        ...this.pageProperties,
        visibleSources: [],
      })
    }

    await this.refreshChartData()
    this.$loader.off()
  }

  private citiesInputFilter (item: any, queryText: string, itemText: string): boolean {
    const _query = queryText.toLocaleLowerCase()
    return itemText.toLocaleLowerCase().indexOf(_query) > -1 ||
      (item.country_name || '').toLocaleLowerCase().indexOf(_query) > -1
  }

  private chooseDefaultSource (sources: Source[] = []): Source|undefined {
    const _sources = _orderBy(sources, '_measurementsNumber', 'desc')
    return _sources[0]
  }
}
</script>
