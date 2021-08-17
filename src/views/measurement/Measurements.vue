<template>
<div class="view-measurements fill-height" style="overflow: auto;">
  <v-container class="pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" md="5" lg="6" xl="6">
        <SelectBoxCities
          :value="urlQuery.cities"
          :label="$t('cities')"
          :items="chartData.cities"
          :disabled="isLoading"
          @input="onChangeQuery({...urlQuery, cities: $event})"
        />
      </v-col>

      <v-col>
        <DatesIntervalInput
          :dateStart="toNumberDate(urlQuery.date_start)"
          :dateEnd="toNumberDate(urlQuery.date_end)"
          format="YYYY-MM-DD"
          :disabled="isLoading"
          @input="onChangeQuery({
            ...urlQuery,
            date_start: toURLStringDate($event.dateStart),
            date_end: toURLStringDate($event.dateEnd),
          })"
        />
      </v-col>

      <v-spacer/>

      <v-col class="d-flex justify-end align-center">
        <v-btn
          class="ml-3"
          :disabled="isLoading"
          :loading="isLoading || isChartLoading"
          @click="onClickRefresh"
          color="primary"
        >
          {{ $t('refresh') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <v-container class="mt-4 px-8" fluid>
    <MeasurementsRightDrawer
      :queryParams="urlQuery"
      :chartData="chartData"
      :open.sync="isRightPanelOpen"
      :loading="isChartLoading"
      :disabledStations="false"
      @update:queryParams="onChangeQuery"
      @click:export="onClickExport"
    />

    <MeasurementsChart
      :queryParams="urlQuery"
      :chartData="chartData"
      :cols.sync="chartCols"
      :chartDisplayMode="displayMode"
      :runningAverage="runningAverage"
      :displayStations="allowDisplayStations"
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
import json2csv from 'json2csv'
import { saveAs } from 'file-saver'
import { Component, Vue } from 'vue-property-decorator'
import { URL_DATE_FORMAT, toURLStringDate, toNumberDate, toQueryString } from '@/utils'
import { ModuleState } from '@/store'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'
import Measurement, { MeasurementProcesses } from '@/entities/Measurement'
import POLLUTANTS from '@/constants/pollutants.json'
import CityAPI from '@/api/CityAPI'
import MeasurementAPI from '@/api/MeasurementAPI'
import { ExportFileType } from '@/components/ExportBtn.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import DatesIntervalInput from '@/components/DatesIntervalInput/DatesIntervalInput.vue'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'
import MeasurementsRightDrawer from './components/MeasurementsRightDrawer.vue'
import ChartData from './components/MeasurementsChart/ChartData'
import ChartColumnSize from './components/MeasurementsChart/ChartColumnSize'
import RunningAverageEnum from './types/RunningAverageEnum'
import URLQuery, { URLQueryStations } from './types/URLQuery'

const today: string = toURLStringDate(moment().format(URL_DATE_FORMAT))
const JAN_1__THREE_YEARS_AGO: number = +moment(0).year(moment().year() - 2)

@Component({
  components: {
    MeasurementsRightDrawer,
    DatesIntervalInput,
    SelectBoxCities,
    MeasurementsChart,
  }
})
export default class ViewMeasurements extends Vue {
  private isLoading: boolean = false
  private isChartLoading: boolean = false

  private chartData: ChartData = {
    cities: [],
    measurements: [],
    pollutants: [],
    sources: [],
    stations: [],
  }

  private get urlQuery (): URLQuery {
    const q = this.$route.query

    const cities = Array.isArray(q.cities) ? q.cities : [q.cities]
    const sources = Array.isArray(q.sources) ? q.sources : [q.sources]
    const pollutants = Array.isArray(q.pollutants) ? q.pollutants : [q.pollutants]
    const stations = Array.isArray(q.stations) ? q.stations : [q.stations]
    const date_start = q.date_start
      ? toURLStringDate(q.date_start as string)
      : ''
    const date_end = q.date_end
      ? toURLStringDate(q.date_end as string)
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
      ? toURLStringDate(queryForm.date_start)
      : ''
    const date_end = queryForm.date_end
      ? toURLStringDate(queryForm.date_end)
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
    return this.urlQuery.sources || []
  }

  private get filterPollutants (): Pollutant['id'][] {
    return this.urlQuery.pollutants || []
  }

  private get filterStations (): Station['id'][] {
    return this.urlQuery.stations || []
  }

  private get displayMode (): ChartDisplayModes|null {
    return this.urlQuery.display_mode || null
  }

  private get runningAverage (): RunningAverageEnum|null {
    return this.urlQuery.running_average || null
  }

  private get allowDisplayStations (): boolean {
    return this.displayMode !== ChartDisplayModes.SUPERIMPOSED_YEARS
  }

  private get chartCols (): ChartColumnSize|0 {
    return this.urlQuery.chart_cols || 0
  }
  private set chartCols (cols: ChartColumnSize|0) {
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
    this.chartData.cities = cities

    // set from cache
    if (!this.urlQuery.cities.length && this.queryFormCached?.cities.length) {
      this.urlQuery = {
        ...this.urlQuery,
        cities: this.queryFormCached?.cities || []
      }
    }

    if (this.urlQuery.cities.length) {

      // filter only existing cities
      const idsMap = this.urlQuery.cities
        .reduce((memo: {[id: string]: number}, id: City['id']) => {
          memo[id] = 1
          return memo
        }, {})
      const existingCities = cities.filter(city => idsMap[city.id])

      this.urlQuery = {
        ...this.urlQuery,
        cities: existingCities.map(i => i.id)
      }
    } else if (cities[0]) {
      this.urlQuery = {
        ...this.urlQuery,
        cities: [cities[0].id]
      }
    }

    await this.refreshChartData()

    this.isChartLoading = false
    this.$loader.off()
  }

  private setQueryFormDefaults (): void {
    const urlQuery = {...this.urlQuery}

    if (!urlQuery.chart_cols) {
      urlQuery.chart_cols = MeasurementsChart.getMaxChartCols(
        this.$vuetify,
        this.urlQuery.cities.length,
        this.urlQuery.pollutants.length,
      )
    }

    if (!urlQuery.date_start) {
      urlQuery.date_start = toURLStringDate(JAN_1__THREE_YEARS_AGO)
    }

    if (!urlQuery.date_end) {
      urlQuery.date_end = toURLStringDate(today)
    }

    if (!urlQuery.running_average) {
      urlQuery.running_average = RunningAverageEnum['1m']
    }

    if (urlQuery.stations?.length) {
      urlQuery.display_mode = ChartDisplayModes.NORMAL
    }

    Object.assign(this.urlQuery, urlQuery)
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

  private async fetchChartData (): Promise<ChartData> {
    const newChartData: ChartData = {
      cities: this.chartData.cities,
      measurements: [],
      pollutants: [],
      sources: [],
      stations: [],
    }

    if (!this.urlQuery?.cities.length) return newChartData

    let _dateStart: number = toNumberDate(this.urlQuery.date_start || '0')

    // shift the queried 'from' date by 1 year ago
    // so the running average display well
    if ((_dateStart || 0) > 0) {
      const _date = moment(_dateStart)
      _dateStart = +_date.year(_date.year() - 1)
    }
    const dateStart = _dateStart ? toURLStringDate(_dateStart) : undefined
    const dateEnd = this.urlQuery.date_end === '0'
      ? undefined
      : this.urlQuery.date_end

    const promises = []

    promises.push(
      this.fetchMeasurements({
        city: this.urlQuery.cities,
        date_from: dateStart,
        date_to: dateEnd,
        process: MeasurementProcesses.city_day_mad,
        sort_by: 'asc(pollutant),asc(date)',
      })
    )

    if (this.filterStations.length) {
      promises.push(
        this.fetchMeasurements({
          city: this.urlQuery.cities,
          date_from: dateStart,
          date_to: dateEnd,
          process: MeasurementProcesses.station_day_mad,
          sort_by: 'asc(pollutant),asc(date)',
        })
      )
    }

    const [err, arrays = []] = await to<Measurement[][]>(Promise.all(promises))

    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const measurementsByCities = arrays[0] || []
    const measurementsByStations = arrays[1] || []
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
            name: meas.location_id,
            city_id: meas.city_id,
            country_id: meas.country_id,
            _measurementsNumber: 0,
          }
        }
        return memo
      }, {})
    const stations = _orderBy(Object.values(stationsMap), 'id')

    newChartData.measurements = measurements
    newChartData.pollutants = pollutants
    newChartData.sources = sources
    newChartData.stations = stations
    return newChartData
  }

  private async refreshChartData (): Promise<void> {
    this.isChartLoading = true

    const chartData = await this.fetchChartData()

    // automatically select the source with the most measurements in city-level
    const allSources = chartData.sources
    let visibleSources = (this.urlQuery.sources || [])
      .filter(id => allSources.find((p) => p.id === id))
    if (!visibleSources.length) {
      const defaultSource = this.chooseDefaultSource(allSources)
      visibleSources = defaultSource ? [defaultSource.id] : []
    }

    const allPollutants = chartData.pollutants
    let visiblePollutants = (this.urlQuery.pollutants || [])
      .filter(id => allPollutants.find((p) => p.id === id))
    if (!visiblePollutants.length) visiblePollutants = allPollutants.map(i => i.id)

    const allStations = chartData.stations
    let visibleStations = (this.urlQuery.stations || [])
      .filter(id => allStations.find((p) => p.id === id))
    if (this.urlQuery.stations?.[0] === URLQueryStations.all) {
      visibleStations = allStations.map(i => i.id)
    }

    this.chartData = chartData
    this.urlQuery = {
      ...this.urlQuery,
      sources: visibleSources,
      pollutants: visiblePollutants,
      stations: visibleStations,
    }

    this.isChartLoading = false
  }

  private async fetchMeasurements (
    query: {
      city: string[]
      date_from?: string
      date_to?: string
      process?: MeasurementProcesses
      sort_by?: string
    }
  ): Promise<Measurement[]> {

    const [err, items] = await to(MeasurementAPI.findAll(toQueryString(query)))
    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  private onChangeQuery (query: URLQuery) {
    const citiesOld = [...this.urlQuery.cities].sort().join(',')
    const citiesNew = [...query.cities].sort().join(',')
    const citiesChanged = citiesOld !== citiesNew
    if (citiesChanged) query.sources = []

    const stationsChanged = query.stations?.[0] === URLQueryStations.all
    const displayModeChanged = query.display_mode !== this.urlQuery.display_mode

    const needRefresh = query.date_start !== this.urlQuery.date_start ||
      query.date_end !== this.urlQuery.date_end ||
      citiesChanged ||
      stationsChanged

    if (displayModeChanged &&
      query.display_mode === ChartDisplayModes.SUPERIMPOSED_YEARS) {
      query.stations = []
    } else if (query.stations?.length) {
      query.display_mode = ChartDisplayModes.NORMAL
    }

    this.urlQuery = query

    if (needRefresh) this.onClickRefresh()
  }

  private async onClickRefresh () {
    this.$loader.on()
    await this.refreshChartData()
    this.$loader.off()
  }

  private onClickExport (fileType: ExportFileType) {
    if (fileType === ExportFileType.CSV) {
      this.onClickExportToCSV()
    }
  }

  private onClickExportToCSV () {
    const citiesNames: string[] = this.urlQuery.cities
      .map(cityId => this.chartData.cities.find(city => city.id === cityId)?.name)
      .filter(i => i) as string[]

    this.exportToCSV(citiesNames, this.chartData.measurements)
  }

  private exportToCSV (locationsNames: string[], measurements: Measurement[]) {
    this.$loader.on()

    let items: Measurement[] = [];

    if (this.urlQuery.stations?.length) {
      items = measurements
        .filter(item => item.process_id === MeasurementProcesses.station_day_mad)
    } else {
      items = measurements
        .filter(item => item.process_id === MeasurementProcesses.city_day_mad)
    }

    const dateStart = toNumberDate(this.urlQuery.date_start || '0')
    const dateEnd = toNumberDate(this.urlQuery.date_end || '0')
    const interval = DatesIntervalInput.determineInterval(dateStart, dateEnd)
    const dates = DatesIntervalInput.formatValue(
      interval,
      dateStart,
      dateEnd,
      'YYYY-MM-DD',
    )
      .toLowerCase()
      .replace(/<.+?>/g, '')
      .replace(/\s/g, '_')

    const filename = `measurements.${locationsNames.join('+')}.${dates}.csv`
      .replace(/\s/g, '')

    const fields: string[] = Object.keys({
      ...(items[0] || {}),
      id: 1,
      name: 1,
      country_id: 1,
      location_id: 1,
      city_id: 1,
      source: 1,
      date: 1,
      level: 1,
      value: 1,
      unit: 1,
      pollutant: 1,
      names: 1,
      gpw: 1,
      timezone: 1,
      process_id: 1,
      gadm1_id: 1,
      name_local: 1,
      geometry: 1,
    })

    const opts = {
      fields,
      header: true,
      quote: '"',
      delimiter: ',',
    }

    try {
      const csv = json2csv.parse(items, opts)
      const blob = new Blob([csv], {type: 'application/csvcharset=utf-8'})
      saveAs(blob, filename)
      this.$loader.off()
    } catch (err) {
      this.$loader.off()
      console.error(err)
      this.$dialog.notify.error(
        err?.message || err || ''+this.$t('msg.something_went_wrong')
      )
      throw err
    }
  }

  private chooseDefaultSource (sources: Source[] = []): Source|undefined {
    const _sources = _orderBy(sources, '_measurementsNumber', 'desc')
    return _sources[0]
  }

  private toURLStringDate (d: number): string {
    return toURLStringDate(d)
  }
  private toNumberDate (d: string): number {
    return toNumberDate(d)
  }
}
</script>
