<template>
  <div class="view-measurements fill-height" style="overflow: auto">
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
            @input="
              onChangeQuery({
                ...urlQuery,
                date_start: toURLStringDate($event.dateStart),
                date_end: toURLStringDate($event.dateEnd),
              })
            "
          />
        </v-col>

        <v-spacer />

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

      <template
        v-if="urlQuery && urlQuery.cities.length > LIMIT_FETCH_ITEMS_FROM_API"
      >
        <v-alert class="text-center my-12 px-12" color="warning lighten-2">
          <div class="d-flex justify-center">
            {{
              $t(
                'msg.limit_exceeded__server_cannot_process_amount__reduce_query'
              )
            }}
          </div>

          <b class="d-flex justify-center pt-2">
            {{
              $t('msg.queried_of_limit', {
                queried: `${urlQuery.cities.length} ${$t(
                  'cities'
                ).toLowerCase()}`,
                limit: `${LIMIT_FETCH_ITEMS_FROM_API} ${$t(
                  'cities'
                ).toLowerCase()}`,
              })
            }}
          </b>
        </v-alert>
      </template>

      <template
        v-else-if="urlQuery && urlQuery.cities.length > LIMIT_RENDER_ITEMS"
      >
        <v-alert class="text-center my-12 px-12" color="warning lighten-3">
          <div class="d-flex justify-center">
            {{
              $t(
                'msg.limit_exceeded__app_cannot_render_amount__you_can_export_file'
              )
            }}
          </div>

          <b class="d-flex justify-center pt-2">
            {{
              $t('msg.loaded_of_limit', {
                loaded: `${urlQuery.cities.length} ${$t(
                  'cities'
                ).toLowerCase()}`,
                limit: `${LIMIT_RENDER_ITEMS} ${$t('cities').toLowerCase()}`,
              })
            }}
          </b>
        </v-alert>

        <v-row class="justify-center">
          <ExportBtn class="d-flex" :value="'CSV'" @click="onClickExport" />
        </v-row>
      </template>

      <MeasurementsChart
        v-else
        :queryParams="urlQuery"
        :chartData="chartData"
        :cols.sync="chartCols"
        :chartDisplayMode="displayMode"
        :runningAverage="runningAverage"
        :displayStations="allowDisplayStations"
        :filterSources="filterSources"
        :filterPollutants="filterPollutants"
        :filterStations="filterStations"
        :maxColHeight="maxColHeight"
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
import {saveAs} from 'file-saver'
import {Component, Vue} from 'vue-property-decorator'
import {
  URL_DATE_FORMAT,
  toURLStringDate,
  toNumberDate,
  toQueryString,
} from '@/utils'
import config from '@/config'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'
import Measurement, {MeasurementProcesses} from '@/entities/Measurement'
import CityAPI from '@/api/CityAPI'
import MeasurementAPI from '@/api/MeasurementAPI'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import DatesIntervalInput from '@/components/DatesIntervalInput/DatesIntervalInput.vue'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'
import MeasurementsRightDrawer from './components/MeasurementsRightDrawer.vue'
import ChartData from './components/MeasurementsChart/ChartData'
import ChartColumnSize from './components/MeasurementsChart/ChartColumnSize'
import RunningAverageEnum from './types/RunningAverageEnum'
import URLQuery, {URLQueryRaw, URLQueryStations} from './types/URLQuery'

const today: string = toURLStringDate(moment().format(URL_DATE_FORMAT))
const JAN_1__THREE_YEARS_AGO: number = +moment(0).year(moment().year() - 2)
const _queryToArray = (itm: string | string[] | undefined) =>
  (Array.isArray(itm) ? itm : ([itm] as any[])).filter((i) => i)

@Component({
  components: {
    MeasurementsRightDrawer,
    DatesIntervalInput,
    SelectBoxCities,
    MeasurementsChart,
    ExportBtn,
  },
})
export default class ViewMeasurements extends Vue {
  private isLoading: boolean = false
  private isChartLoading: boolean = false
  private readonly LIMIT_RENDER_ITEMS: number = 20
  private readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  private chartData: ChartData = {
    cities: [],
    measurements: [],
    pollutants: [],
    sources: [],
    stations: [],
  }

  private get urlQuery(): URLQuery {
    const q: URLQueryRaw = {...this.$route.query}

    // TODO: delete
    // fallback for old URL format
    if (!q.ct && (q as any).cities) q.ct = (q as any).cities
    if (!q.sr && (q as any).sources) q.sr = (q as any).sources
    if (!q.pl && (q as any).pollutants) q.pl = (q as any).pollutants
    if (!q.st && (q as any).stations) q.st = (q as any).stations
    if (!q.start && (q as any).date_start) q.start = (q as any).date_start
    if (!q.end && (q as any).date_end) q.end = (q as any).date_end
    if (!q.dspl && (q as any).display_mode) q.dspl = (q as any).display_mode
    if (!q.avg && (q as any).running_average) q.avg = (q as any).running_average
    if (!q.cols && (q as any).chart_cols) q.cols = (q as any).chart_cols

    return {
      cities: _queryToArray(q.ct),
      sources: _queryToArray(q.sr),
      pollutants: _queryToArray(q.pl),
      stations: _queryToArray(q.st),
      date_start: q.start ? toURLStringDate(q.start as string) : '',
      date_end: q.end ? toURLStringDate(q.end as string) : '',
      display_mode: q.dspl
        ? ((String(q.dspl) || '').toUpperCase() as ChartDisplayModes)
        : undefined,
      running_average: (q.avg as RunningAverageEnum) || undefined,
      chart_cols: (Number(q.cols) || 0) as ChartColumnSize,
    }
  }

  private async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      ct: inputQuery.cities,
      sr: inputQuery.sources,
      pl: inputQuery.pollutants,
      st: inputQuery.stations,
      start: inputQuery.date_start
        ? toURLStringDate(inputQuery.date_start)
        : undefined,
      end: inputQuery.date_end
        ? toURLStringDate(inputQuery.date_end)
        : undefined,
      dspl: inputQuery.display_mode,
      avg: inputQuery.running_average,
      cols: String(inputQuery.chart_cols || 0),
    }

    for (const _key in query) {
      const key: keyof URLQueryRaw = _key as any
      if (!query[key]) delete query[key]
    }

    let newRoute = this.$router.resolve({
      ...(this.$route as any),
      query,
    })

    if ((newRoute.href.length || 0) > 2000) {
      const newHref = newRoute.href.slice(0, 2000).replace(/\&[^&]*$/, '')
      newRoute = this.$router.resolve(newHref)
      this.$dialog.notify.warning(this.$t('msg.too_large_url').toString())
    }

    if (this.$route.fullPath !== newRoute.href) {
      const newRouteQuery: URLQueryRaw = newRoute.route.query
      this.$store.commit('SET', {
        key: 'queryForm.cities',
        value: newRouteQuery.ct,
      })
      this.$store.commit('SET', {
        key: 'queryForm.dateStart',
        value: newRouteQuery.start,
      })
      this.$store.commit('SET', {
        key: 'queryForm.dateEnd',
        value: newRouteQuery.end,
      })
      await this.$router.replace(newRoute.href)
    }
  }

  private get filterSources(): Source['id'][] {
    return this.urlQuery.sources || []
  }

  private get filterPollutants(): Pollutant['id'][] {
    return this.urlQuery.pollutants || []
  }

  private get filterStations(): Station['id'][] {
    return this.urlQuery.stations || []
  }

  private get displayMode(): ChartDisplayModes | null {
    return this.urlQuery.display_mode || null
  }

  private get runningAverage(): RunningAverageEnum | null {
    return this.urlQuery.running_average || null
  }

  private get allowDisplayStations(): boolean {
    return this.displayMode !== ChartDisplayModes.SUPERIMPOSED_YEARS
  }

  private get maxColHeight(): number | undefined {
    const h: number = this.$parent?.$el?.clientHeight
    if (h === undefined) return h
    return h * 0.7
  }

  private get chartCols(): ChartColumnSize | 0 {
    return this.urlQuery.chart_cols || 0
  }
  private set chartCols(cols: ChartColumnSize | 0) {
    this.setUrlQuery({
      ...this.urlQuery,
      chart_cols: cols,
    })
  }

  private get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.measurements.isRightPanelOpen')
  }
  private set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.measurements.isRightPanelOpen', value})
  }

  private get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }

  private async beforeMount() {
    this.isLoading = true
    await this.fetch()
    this.isLoading = false
  }

  private async fetch() {
    this.$loader.on()
    this.isChartLoading = true

    await this.setUrlQueryDefaults()

    const cities = await this.fetchCities()
    this.chartData.cities = cities

    if (this.urlQuery.cities.length) {
      // filter only existing cities
      const idsMap = this.urlQuery.cities.reduce(
        (memo: {[id: string]: number}, id: City['id']) => {
          memo[id] = 1
          return memo
        },
        {}
      )
      const existingCities = Object.keys(idsMap).length
        ? cities.filter((city) => idsMap[city.id])
        : []

      await this.setUrlQuery({
        ...this.urlQuery,
        cities: existingCities.map((i) => i.id),
      })
    } else if (cities[0]) {
      await this.setUrlQuery({
        ...this.urlQuery,
        cities: [cities[0].id],
      })
    }

    await this.refreshChartData()

    this.isChartLoading = false
    this.$loader.off()
  }

  private async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    // set from cache
    if (!urlQuery.cities.length && this.queryFormCached?.cities.length) {
      urlQuery.cities = this.queryFormCached.cities
    }

    if (!urlQuery.chart_cols) {
      urlQuery.chart_cols = MeasurementsChart.getMaxChartCols(
        this.$vuetify,
        this.urlQuery.cities.length,
        this.urlQuery.pollutants.length
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

    await this.setUrlQuery(urlQuery)
  }

  private async fetchCities(): Promise<City[]> {
    const [err, cities] = await to(CityAPI.findAll())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return _orderBy(cities || [], 'name')
  }

  private async fetchChartData(): Promise<ChartData> {
    if ((this.urlQuery?.cities.length || 0) > this.LIMIT_FETCH_ITEMS_FROM_API) {
      this.$dialog.notify.warning(this.$t('msg.too_large_query').toString())
      throw new Error('exit')
    }

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
    const dateEnd =
      this.urlQuery.date_end === '0' ? undefined : this.urlQuery.date_end

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
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const measurementsByCities = arrays[0] || []
    const measurementsByStations = arrays[1] || []
    const measurements = measurementsByCities.concat(measurementsByStations)

    const pollutantsMap = measurementsByCities.reduce(
      (memo: {[pollutantId: string]: Pollutant}, meas: Measurement) => {
        const pollutantId = meas.pollutant?.toLowerCase() || ''
        if (pollutantId && !memo[pollutantId]) {
          memo[pollutantId] = {
            id: pollutantId,
            label: pollutantId.toUpperCase(),
            unit: meas.unit,
          }
        }
        return memo
      },
      {}
    )
    const pollutants = _orderBy(Object.values(pollutantsMap), 'id')

    const sourcesMap = measurementsByCities.reduce(
      (memo: {[sourceId: string]: Source}, meas: Measurement) => {
        if (!meas.source) return memo
        if (memo[meas.source]) {
          memo[meas.source]._measurementsNumber =
            1 + (memo[meas.source]?._measurementsNumber || 0)
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
      },
      {}
    )
    const sources = _orderBy(Object.values(sourcesMap), 'id')

    const stationsMap = measurementsByStations.reduce(
      (memo: {[stationId: string]: Station}, meas: Measurement) => {
        if (!meas.source) return memo
        if (memo[meas.location_id]) {
          memo[meas.location_id]._measurementsNumber =
            1 + (memo[meas.location_id]?._measurementsNumber || 0)
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
      },
      {}
    )
    const stations = _orderBy(Object.values(stationsMap), 'id')

    newChartData.measurements = measurements
    newChartData.pollutants = pollutants
    newChartData.sources = sources
    newChartData.stations = stations
    return newChartData
  }

  private async refreshChartData(): Promise<void> {
    this.isChartLoading = true

    const [err, chartData] = await to(this.fetchChartData())
    if (err) {
      this.isChartLoading = false
      if (err?.message === 'exit') return
      else throw err
    }
    if (!chartData) {
      this.isChartLoading = false
      return
    }

    // automatically select the source with the most measurements in city-level
    const allSources = chartData.sources
    let visibleSources = (this.urlQuery.sources || []).filter((id) =>
      allSources.find((p) => p.id === id)
    )
    if (!visibleSources.length) {
      const defaultSource = this.chooseDefaultSource(allSources)
      visibleSources = defaultSource ? [defaultSource.id] : []
    }

    const allPollutants = chartData.pollutants
    let visiblePollutants = (this.urlQuery.pollutants || []).filter((id) =>
      allPollutants.find((p) => p.id === id)
    )
    if (!visiblePollutants.length)
      visiblePollutants = allPollutants.map((i) => i.id)

    const allStations = chartData.stations
    let visibleStations = (this.urlQuery.stations || []).filter((id) =>
      allStations.find((p) => p.id === id)
    )
    if (this.urlQuery.stations?.[0] === URLQueryStations.all) {
      visibleStations = allStations.map((i) => i.id)
    }

    this.chartData = chartData
    await this.setUrlQuery({
      ...this.urlQuery,
      sources: visibleSources,
      pollutants: visiblePollutants,
      stations: visibleStations,
    })

    this.isChartLoading = false
  }

  private async fetchMeasurements(query: {
    city: string[]
    date_from?: string
    date_to?: string
    process?: MeasurementProcesses
    sort_by?: string
  }): Promise<Measurement[]> {
    const [err, items] = await to(MeasurementAPI.findAll(toQueryString(query)))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  private async onChangeQuery(query: URLQuery) {
    const citiesOld = [...this.urlQuery.cities].sort().join(',')
    const citiesNew = [...query.cities].sort().join(',')
    const citiesChanged = citiesOld !== citiesNew
    if (citiesChanged) query.sources = []

    const stationsChanged = query.stations?.[0] === URLQueryStations.all
    const displayModeChanged = query.display_mode !== this.urlQuery.display_mode

    const needRefresh =
      query.date_start !== this.urlQuery.date_start ||
      query.date_end !== this.urlQuery.date_end ||
      citiesChanged ||
      stationsChanged

    if (
      displayModeChanged &&
      query.display_mode === ChartDisplayModes.SUPERIMPOSED_YEARS
    ) {
      query.stations = []
    } else if (query.stations?.length) {
      query.display_mode = ChartDisplayModes.NORMAL
    }

    await this.setUrlQuery(query)

    if (needRefresh) this.onClickRefresh()
  }

  private async onClickRefresh() {
    this.$loader.on()
    await this.refreshChartData()
    this.$loader.off()
  }

  private onClickExport(fileType: ExportFileType) {
    if (fileType === ExportFileType.CSV) {
      this.onClickExportToCSV()
    }
  }

  private onClickExportToCSV() {
    const citiesNames: string[] = this.urlQuery.cities
      .map(
        (cityId) =>
          this.chartData.cities.find((city) => city.id === cityId)?.name
      )
      .filter((i) => i) as string[]

    this.exportToCSV(citiesNames, this.chartData.measurements)
  }

  private exportToCSV(locationsNames: string[], measurements: Measurement[]) {
    this.$loader.on()

    let items: Measurement[] = []

    if (this.urlQuery.stations?.length) {
      items = measurements.filter(
        (item) => item.process_id === MeasurementProcesses.station_day_mad
      )
    } else {
      items = measurements.filter(
        (item) => item.process_id === MeasurementProcesses.city_day_mad
      )
    }

    const dateStart = toNumberDate(this.urlQuery.date_start || '0')
    const dateEnd = toNumberDate(this.urlQuery.date_end || '0')
    const interval = DatesIntervalInput.determineInterval(dateStart, dateEnd)
    const dates = DatesIntervalInput.formatValue(
      interval,
      dateStart,
      dateEnd,
      'YYYY-MM-DD'
    )
      .toLowerCase()
      .replace(/<.+?>/g, '')
      .replace(/\s/g, '_')

    const filename = `measurements.${locationsNames.join(
      '+'
    )}.${dates}.csv`.replace(/\s/g, '')

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
        err?.message || err || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }
  }

  private chooseDefaultSource(sources: Source[] = []): Source | undefined {
    const _sources = _orderBy(sources, '_measurementsNumber', 'desc')
    return _sources[0]
  }

  private toURLStringDate(d: number): string {
    return toURLStringDate(d)
  }
  private toNumberDate(d: string): number {
    return toNumberDate(d)
  }
}
</script>
