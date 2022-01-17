<template>
  <div
    class="view-measurements fill-height"
    :class="{
      'right-panel-open': isRightPanelOpen,
    }"
  >
    <v-container
      class="page-content fill-height pa-0 align-content-start"
      fluid
    >
      <div
        v-if="urlQuery && urlQuery.cities.length > LIMIT_FETCH_ITEMS_FROM_API"
        class="view-measurements__message-banner pa-12"
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
                queried: `${urlQuery.cities.length} ${$t('cities')
                  .toString()
                  .toLowerCase()}`,
                limit: `${LIMIT_FETCH_ITEMS_FROM_API} ${$t('cities')
                  .toString()
                  .toLowerCase()}`,
              })
            }}
          </b>
        </v-alert>
      </div>

      <div
        v-else-if="urlQuery && urlQuery.cities.length > LIMIT_RENDER_ITEMS"
        class="view-measurements__message-banner pa-12"
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
                loaded: `${urlQuery.cities.length} ${$t('cities')
                  .toString()
                  .toLowerCase()}`,
                limit: `${LIMIT_RENDER_ITEMS} ${$t('cities')
                  .toString()
                  .toLowerCase()}`,
              })
            }}
          </b>
        </v-alert>

        <v-row class="justify-center">
          <ExportBtn class="d-flex" :value="'CSV'" @click="onClickExport" />
        </v-row>
      </div>

      <v-container class="pt-10 pt-md-4 px-8" fluid style="z-index: 15">
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
              :dateStart="toNumberDate(urlQuery.date_start || '')"
              :dateEnd="toNumberDate(urlQuery.date_end || '')"
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

          <v-col class="d-flex justify-end align-start pt-8 pl-3">
            <v-list-item
              class="px-2 mr-2"
              dense
              style="flex: 0 1 auto; height: 36px"
              :title="$t('auto_refresh_on_query_change')"
              @click="isAutoRefreshOnQueryChange = !isAutoRefreshOnQueryChange"
            >
              <v-list-item-action class="mr-1 my-1">
                <v-checkbox
                  class="pointer-events-none"
                  v-model="isAutoRefreshOnQueryChange"
                  color="primary"
                  readonly
                />
              </v-list-item-action>
              <v-list-item-title v-text="$t('auto_refresh')" />
            </v-list-item>

            <v-btn
              color="primary"
              :disabled="isLoading"
              :loading="isLoading || isChartLoading"
              @click="onClickRefresh"
            >
              <v-icon left>{{ mdiRefresh }}</v-icon>
              {{ $t('refresh') }}
            </v-btn>

            <PageDrawerHandlerBtn
              v-if="!isRightPanelOpen"
              class="ml-3"
              @click="isRightPanelOpen = true"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-container class="mt-4 px-8" fluid>
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
          :maxColHeight="maxColHeight"
          :outdatedState="!isAutoRefreshOnQueryChange && isChartStateOutdated"
          :loading="isChartLoading"
          :frozen="isKeepAliveInactive"
          @click:refresh="onClickRefresh"
        />
      </v-container>
    </v-container>

    <MeasurementsRightDrawer
      :queryParams="urlQuery"
      :chartData="chartData"
      :open.sync="isRightPanelOpen"
      :loading="isChartLoading"
      :disabledStations="!isAutoRefreshOnQueryChange && isChartStateOutdated"
      @update:queryParams="onChangeQuery"
      @click:export="onClickExport"
    />
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _orderBy from 'lodash.orderby'
import json2csv from 'json2csv'
import {saveAs} from 'file-saver'
import {VueClass} from 'vue-class-component/lib/declarations'
import {Component, Mixins} from 'vue-property-decorator'
import {mdiRefresh} from '@mdi/js'
import {
  URL_DATE_FORMAT,
  toURLStringDate,
  toNumberDate,
  toQueryString,
  toCompactArray,
} from '@/utils'
import config from '@/config'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'
import RunningAverageEnum from '@/entities/RunningAverageEnum'
import Measurement, {MeasurementProcesses} from '@/entities/Measurement'
import CityAPI from '@/api/CityAPI'
import StationAPI from '@/api/StationAPI'
import SourceAPI from '@/api/SourceAPI'
import PollutantAPI from '@/api/PollutantAPI'
import MeasurementAPI from '@/api/MeasurementAPI'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import PageDrawerHandlerBtn from '@/components/PageDrawer/PageDrawerHandlerBtn.vue'
import DatesIntervalInput from '@/components/DatesIntervalInput/DatesIntervalInput.vue'
import KeepAliveQueryMixin, {
  IKeepAliveQueryMixin,
} from '@/mixins/KeepAliveQuery'
import URLQuery, {URLQueryRaw, URLQueryStations} from './types/URLQuery'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'
import MeasurementsRightDrawer from './components/MeasurementsRightDrawer.vue'
import ChartData from './components/MeasurementsChart/ChartData'
import ChartColsNum from './components/MeasurementsChart/ChartColsNum'

const today: string = toURLStringDate(moment().format(URL_DATE_FORMAT))
const JAN_1__THREE_YEARS_AGO: number = +moment(0).year(moment().year() - 2)

const keepAliveQueryMixin: VueClass<IKeepAliveQueryMixin> =
  KeepAliveQueryMixin<ViewMeasurements>({
    hooksMap: {
      reload: 'init',
    },
    sharedQueryGetter(vm) {
      const localStorageQuery: ModuleState['queryForm'] | null =
        vm.$store.getters.GET('queryForm') || null
      const sharedQuery: URLQueryRaw = {
        ct: localStorageQuery?.cities || undefined,
        start: localStorageQuery?.dateStart || undefined,
      }
      return sharedQuery
    },
  })

@Component({
  name: 'ViewMeasurements',
  components: {
    MeasurementsRightDrawer,
    DatesIntervalInput,
    SelectBoxCities,
    MeasurementsChart,
    PageDrawerHandlerBtn,
    ExportBtn,
  },
  metaInfo() {
    return {
      title: `${this.$t('measurements')} - ${config.get('APP_PUBLIC_NAME')}`,
    }
  },
})
export default class ViewMeasurements extends Mixins(keepAliveQueryMixin) {
  public isLoading: boolean = false
  public isChartLoading: boolean = false
  public isChartStateOutdated: boolean = false
  public readonly mdiRefresh = mdiRefresh
  public readonly LIMIT_RENDER_ITEMS: number = 20
  public readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  public chartData: ChartData = {
    cities: [],
    measurements: [],
    pollutants: [],
    sources: [],
    stations: [],
  }

  public get urlQuery(): URLQuery {
    const q: URLQueryRaw = {...this.$route.query}

    return {
      cities: toCompactArray(q.ct),
      sources: toCompactArray(q.sr),
      pollutants: toCompactArray(q.pl),
      stations: toCompactArray(q.st),
      date_start: q.start ? toURLStringDate(q.start as string) : '',
      date_end: q.end ? toURLStringDate(q.end as string) : '',
      display_mode: q.dspl
        ? ((String(q.dspl) || '').toUpperCase() as ChartDisplayModes)
        : undefined,
      running_average: (q.avg as RunningAverageEnum) || undefined,
      chart_cols: (Number(q.cols) || 0) as ChartColsNum,
    }
  }

  public async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    if (this.isKeepAliveInactive) return

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
      await this.$router.replace(newRoute.href, undefined, (err) =>
        console.error(err)
      )
      this.cacheCurrentRouteSnapshot()
    }
  }

  public get filterSources(): Source['id'][] {
    return this.urlQuery.sources || []
  }

  public get filterPollutants(): Pollutant['id'][] {
    return this.urlQuery.pollutants || []
  }

  public get filterStations(): Station['id'][] {
    return this.urlQuery.stations || []
  }

  public get displayMode(): ChartDisplayModes | null {
    return this.urlQuery.display_mode || null
  }

  public get runningAverage(): RunningAverageEnum | null {
    return this.urlQuery.running_average || null
  }

  public get allowDisplayStations(): boolean {
    return this.displayMode !== ChartDisplayModes.SUPERIMPOSED_YEARS
  }

  public get maxColHeight(): number | undefined {
    const h: number = this.$parent?.$el?.clientHeight
    if (h === undefined) return h
    return h * 0.7
  }

  public get chartCols(): ChartColsNum | 0 {
    return this.urlQuery.chart_cols || 0
  }
  public set chartCols(cols: ChartColsNum | 0) {
    this.setUrlQuery({
      ...this.urlQuery,
      chart_cols: cols,
    })
  }

  public get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.measurements.isRightPanelOpen')
  }
  public set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.measurements.isRightPanelOpen', value})
  }

  public get isAutoRefreshOnQueryChange(): boolean {
    return this.$store.getters.GET('ui.measurements.isAutoRefreshOnQueryChange')
  }
  public set isAutoRefreshOnQueryChange(value: boolean) {
    this.$store.commit('SET', {
      key: 'ui.measurements.isAutoRefreshOnQueryChange',
      value,
    })
  }

  public get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }

  public mounted() {
    // see init()
  }

  public async init() {
    this.isLoading = true
    await to(this.fetch())
    this.cacheCurrentRouteSnapshot()
    this.isLoading = false
  }

  public async refresh() {
    this.$loader.on()
    await this.refreshChartData()
    this.$loader.off()
  }

  public async fetch() {
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

  public async setUrlQueryDefaults(): Promise<void> {
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

  public async fetchCities(): Promise<City[]> {
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

  public async fetchChartData(): Promise<ChartData> {
    if ((this.urlQuery?.cities.length || 0) > this.LIMIT_FETCH_ITEMS_FROM_API) {
      this.$dialog.notify.warning(this.$t('msg.too_large_query').toString())
      this.$trackGtmEvent(
        'measurements',
        'error_too_large_query',
        String(this.urlQuery?.cities.length)
      )
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

    let sources: Source[] = []
    let stations: Station[] = []
    let pollutants: Pollutant[] = []
    let measurementsByCities: Measurement[] = []
    let measurementsByStations: Measurement[] = []

    const promises: Promise<any>[] = []

    promises.push(
      this.fetchSources().then((items) => (sources = _orderBy(items, 'id')))
    )

    promises.push(
      this.fetchStations({city: this.urlQuery.cities}).then(
        (items) => (stations = _orderBy(items, 'id'))
      )
    )

    promises.push(this.fetchPollutants().then((items) => (pollutants = items)))

    promises.push(
      this.fetchMeasurements({
        city: this.urlQuery.cities,
        date_from: dateStart,
        date_to: dateEnd,
        process: MeasurementProcesses.city_day_mad,
        sort_by: 'asc(pollutant),asc(date)',
      }).then((items) => (measurementsByCities = items))
    )

    if (this.filterStations.length) {
      promises.push(
        this.fetchMeasurements({
          city: this.urlQuery.cities,
          date_from: dateStart,
          date_to: dateEnd,
          process: MeasurementProcesses.station_day_mad,
          sort_by: 'asc(pollutant),asc(date)',
        }).then((items) => (measurementsByStations = items))
      )
    }

    const [err] = await to(Promise.all(promises))
    if (err) {
      this.$trackGtmEvent('measurements', 'error', err.message)
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }
    const measurements = measurementsByCities.concat(measurementsByStations)

    const usedPollutantsMap = measurementsByCities.reduce(
      (memo: {[pollutantId: string]: number}, meas: Measurement) => {
        const pollutantId = meas.pollutant
        if (pollutantId && !memo[pollutantId]) memo[pollutantId] = 1
        return memo
      },
      {}
    )
    pollutants = pollutants.filter((item) => usedPollutantsMap[item.id])

    const usedSourcesMap = measurementsByCities.reduce(
      (memo: {[sourceId: string]: number}, meas: Measurement) => {
        const sourceId = meas.source
        if (sourceId && !memo[sourceId]) memo[sourceId] = 1
        return memo
      },
      {}
    )
    sources = sources.filter((item) => usedSourcesMap[item.id])

    newChartData.measurements = measurements
    newChartData.pollutants = pollutants
    newChartData.sources = sources
    newChartData.stations = stations
    return newChartData
  }

  public async refreshChartData(): Promise<void> {
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
    this.isChartStateOutdated = false
  }

  public async fetchMeasurements(query: {
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

  public async fetchStations(query: {city: string[]}): Promise<Station[]> {
    let [err, items = []] = await to(StationAPI.findAll(toQueryString(query)))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  public async fetchSources(): Promise<Source[]> {
    let [err, items = []] = await to(SourceAPI.findAll())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  public async fetchPollutants(): Promise<Pollutant[]> {
    let [err, items = []] = await to(PollutantAPI.findAll())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  public async onChangeQuery(query: URLQuery) {
    await new Promise<void>((r) => this.$nextTick(r))
    if (this.isKeepAliveInactive) return

    const citiesOld = [...this.urlQuery.cities].sort().join(',')
    const citiesNew = [...query.cities].sort().join(',')
    const citiesChanged = citiesOld !== citiesNew
    if (citiesChanged) query.sources = []

    const stationsChanged = query.stations?.[0] === URLQueryStations.all
    const displayModeChanged = query.display_mode !== this.urlQuery.display_mode

    if (
      displayModeChanged &&
      query.display_mode === ChartDisplayModes.SUPERIMPOSED_YEARS
    ) {
      query.stations = []
    } else if (query.stations?.length) {
      query.display_mode = ChartDisplayModes.NORMAL
    }

    const needRefresh =
      query.date_start !== this.urlQuery.date_start ||
      query.date_end !== this.urlQuery.date_end ||
      citiesChanged ||
      stationsChanged
    this.isChartStateOutdated = needRefresh || this.isChartStateOutdated

    await this.setUrlQuery(query)

    if (this.isAutoRefreshOnQueryChange && needRefresh) this.refresh()
  }

  public onClickRefresh() {
    this.$trackGtmEvent('measurements', 'refresh')
    this.refresh()
  }

  public onClickExport(fileType: ExportFileType) {
    if (fileType === ExportFileType.CSV) {
      this.$trackGtmEvent('measurements', 'export_to_file', 'csv')
      this.onClickExportToCSV()
    }
  }

  public onClickExportToCSV() {
    const citiesNames: string[] = this.urlQuery.cities
      .map(
        (cityId) =>
          this.chartData.cities.find((city) => city.id === cityId)?.name
      )
      .filter((i) => i) as string[]

    this.exportToCSV(citiesNames, this.chartData.measurements)
  }

  public exportToCSV(locationsNames: string[], measurements: Measurement[]) {
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
    } catch (err: any) {
      this.$loader.off()
      console.error(err)
      this.$dialog.notify.error(
        err?.message || err || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }
  }

  public chooseDefaultSource(sources: Source[] = []): Source | undefined {
    return sources[0]
  }

  public toURLStringDate(d: number): string {
    return toURLStringDate(d)
  }
  public toNumberDate(d: string): number {
    return toNumberDate(d)
  }
}
</script>

<style lang="scss">
$right_panel--width: 250px;

.view-measurements {
  overflow: auto;
  position: unset;

  > .page-content {
    position: relative;
    z-index: 1;
  }

  &__message-banner {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &:before {
      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      background: var(--v-grey-lighten5);
      opacity: 0.7;
    }
  }

  &.right-panel-open {
    width: calc(100% - #{$right_panel--width});
  }
}
</style>