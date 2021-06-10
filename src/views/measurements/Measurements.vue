<template>
<div class="view-measurements fill-height" style="overflow: auto;">
  <v-container class="pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" md="3" lg="3" xl="2">
        <SelectBox
          v-model="queryForm.cities"
          :label="$t('cities')"
          :items="cities"
          :disabled="isLoading"
          item-text="name"
          item-value="id"
          return-object
          hide-details
          has-deselect-all
          @input="onChangeQueryForm"
        >
          <template v-slot:item-subtext="{item}">
            <CountryFlag
              :country="(item.country_id || '').toLowerCase()"
              size="small"
            />
            <span class="grey--text text--base">
              &nbsp;&nbsp;{{ item.country_id }}
            </span>
          </template>
        </SelectBox>
      </v-col>

      <v-col cols="12" sm="6" md="3" lg="2" xl="2">
        <v-menu
          v-model="isMenuDateStartOpen"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
          offset-y
          left
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              :value="dateStartFormat"
              :label="$t('from')"
              :prepend-icon="mdiCalendar"
              :disabled="isLoading"
              readonly
              hide-details
              v-bind="attrs"
              v-on="on"
            />
          </template>

          <v-date-picker
            :value="dateStartFormat"
            @input="($e) => {
              queryForm.dateStart = +new Date($e);
              isMenuDateStartOpen = false;
              onChangeQueryForm()
            }"
          />
        </v-menu>
      </v-col>

      <v-col cols="12" sm="6" md="3" lg="2" xl="2">
        <v-menu
          v-model="isMenuDateEndOpen"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
          offset-y
          left
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              :value="dateEndFormat"
              :label="$t('to')"
              :prepend-icon="mdiCalendar"
              :disabled="isLoading"
              readonly
              hide-details
              v-bind="attrs"
              v-on="on"
            />
          </template>

          <v-date-picker
            :value="dateEndFormat"
            @input="($e) => {
              queryForm.dateEnd = +new Date($e);
              isMenuDateEndOpen = false;
              onChangeQueryForm()
            }"
          />
        </v-menu>
      </v-col>

      <v-col
        class="d-flex justify-end justify-md-start align-center"
        cols="12"
        md="2"
      >
        <v-btn
          class="ml-5"
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
import _sortBy from 'lodash.sortby'
import CountryFlag from 'vue-country-flag'
import { Component, Vue, Ref } from 'vue-property-decorator'
import { mdiCalendar } from '@mdi/js'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'
import Measurement, { MeasurementProcesses } from '@/entities/Measurement'
import POLLUTANTS from '@/constants/pollutants.json'
import CityAPI from '@/api/CityAPI'
import MeasurementAPI from '@/api/MeasurementAPI'
import SelectBox from './components/SelectBox.vue'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import MeasurementsQuery from './components/MeasurementsChart/MeasurementsQuery'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'
import ChartComponentData from './components/MeasurementsChart/ChartComponentData'
import MeasurementsRightDrawer from './components/MeasurementsRightDrawer.vue'
import PagePropertiesForm from './types/PagePropertiesForm'
import ChartColumnSize from './types/ChartColumnSize'
import RunningAverageEnum from './types/RunningAverageEnum'

interface URLQuery {
  cities: City['id'][]
  sources: Source['id'][]
  pollutants: Pollutant['id'][]
  stations?: Station['id'][]
  date_start: number
  date_end?: number
  display_mode?: ChartDisplayModes
  running_average?: RunningAverageEnum
  chart_cols?: ChartColumnSize|0
}

const today = moment(moment().format('YYYY-MM-DD')).valueOf()
const DEFAUL_DISPLAY_MODE = ChartDisplayModes.NORMAL
const DEFAUL_RUNNING_AVERAGE = RunningAverageEnum['1d']

@Component({
  components: {
    MeasurementsRightDrawer,
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
    cities: [],
    measurements: [],
    pollutants: [],
    sources: [],
    stations: [],
  }

  private queryForm: MeasurementsQuery = {
    cities: [],
    dateStart: today,
    dateEnd: today,
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

    return {
      cities: cities.filter(i => i) as City['id'][],
      sources: sources.filter(i => i) as Source['id'][],
      pollutants: pollutants.filter(i => i) as Pollutant['id'][],
      stations: stations.filter(i => i) as Station['id'][],
      date_start: q.date_start ? Number(q.date_start) : 0,
      date_end: q.date_end ? Number(q.date_end) : 0,
      chart_cols: (Number(q.chart_cols) || 0) as ChartColumnSize,
      display_mode: q.display_mode
        ? (String(q.display_mode) || '').toUpperCase() as ChartDisplayModes
        : undefined,
    }
  }

  private set urlQuery (queryForm: URLQuery) {
    const newPath = this.$router.resolve({
      ...(this.$route as any),
      query: queryForm
    }).href

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
    if (!this.urlQuery.chart_cols) {
      this.urlQuery = {
        ...this.urlQuery,
        chart_cols: MeasurementsChart.getDefaultChartCols(this.$vuetify),
      }
    }

    if ((this.urlQuery.date_start || 0) > 0) {
      this.queryForm.dateStart = this.urlQuery.date_start
    } else {
      if (!this.queryForm.dateStart) this.queryForm.dateStart = today
      this.urlQuery = {...this.urlQuery, date_start: this.queryForm.dateStart}
    }

    if ((this.urlQuery.date_end || 0) > 0) {
      this.queryForm.dateEnd = this.urlQuery.date_end
    } else {
      if (!this.queryForm.dateEnd) this.queryForm.dateEnd = today
      this.urlQuery = {...this.urlQuery, date_end: this.queryForm.dateEnd}
    }

    this.pageProperties.chartColumnSize = this.urlQuery.chart_cols as ChartColumnSize

    if (this.urlQuery.display_mode) {
      this.pageProperties.displayMode = this.urlQuery.display_mode
    } else if (!this.pageProperties.displayMode) {
      this.pageProperties.displayMode = DEFAUL_DISPLAY_MODE
    }

    if (this.urlQuery.running_average) {
      this.pageProperties.runningAverage = this.urlQuery.running_average
    } else if (!this.pageProperties.runningAverage) {
      this.pageProperties.runningAverage = DEFAUL_RUNNING_AVERAGE
    }

    if (this.urlQuery.sources?.length) {
      this.pageProperties.visibleSources = this.urlQuery.sources
    }
    if (this.urlQuery.pollutants?.length) {
      this.pageProperties.visiblePollutants = this.urlQuery.pollutants
    }
    if (this.urlQuery.stations?.length) {
      this.pageProperties.visibleStations = this.urlQuery.stations
    }
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
    return _sortBy(cities || [], 'name')
  }

  private async fetchChartData (): Promise<ChartComponentData> {
    const promise_measurementsByCities = this.fetchMeasurements({
      ...this.queryForm,
      process: MeasurementProcesses.city_day_mad,
      sortBy: 'asc(pollutant),asc(date)'
    })

    const promise_measurementsByStations = this.fetchMeasurements({
      ...this.queryForm,
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
    const pollutants = _sortBy(Object.values(pollutantsMap), 'id')

    const sourcesMap = measurementsByCities
      .reduce((memo: {[sourceId: string]: Source}, meas: Measurement) => {
        if (meas.source && !memo[meas.source]) {
          memo[meas.source] = {id: meas.source, label: meas.source}
        }
        return memo
      }, {})
    const sources = _sortBy(Object.values(sourcesMap), 'id')

    const stationsMap = measurementsByStations
      .reduce((memo: {[stationId: string]: Station}, meas: Measurement) => {
        if (meas.location_id && !memo[meas.location_id]) {
          memo[meas.location_id] = {
            id: meas.location_id,
            label: meas.location_id,
            cityId: meas.city_id,
          }
        }
        return memo
      }, {})
    const stations = _sortBy(Object.values(stationsMap), 'id')

    const chartData = {
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
    if (!visibleSources.length) {
      visibleSources = this.pageProperties.sources.length
        ? [this.pageProperties.sources[0]?.id]
        : []
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

  private onChangeQueryForm () {
    this.urlQuery = {
      ...this.urlQuery,
      cities: this.queryForm.cities.map(i => i.id),
      date_start: this.queryForm.dateStart,
      date_end: this.queryForm.dateEnd,
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
    await this.refreshChartData()
    this.$loader.off()
  }
}
</script>
