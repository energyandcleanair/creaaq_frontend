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
      :filterSources="filterSources"
      :filterPollutants="filterPollutants"
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
import Measurement from '@/entities/Measurement'
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

interface URLQuery {
  cities: City['id'][]
  sources: Source['id'][]
  pollutants: Pollutant['id'][]
  date_start: number
  date_end?: number
  display_mode?: ChartDisplayModes
  chart_cols?: ChartColumnSize|0
}

const today = moment(moment().format('YYYY-MM-DD')).valueOf()

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
  }

  private queryForm: MeasurementsQuery = {
    cities: [],
    dateStart: today,
    dateEnd: today,
  }

  private pageProperties: PagePropertiesForm = {
    displayMode: ChartDisplayModes.NORMAL,
    runningAverage: '',
    chartColumnSize: 12,
    sources: [],
    visibleSources: [],
    pollutants: [],
    visiblePollutants: [],
    isShowStations: false,
    stationsDisplayOptions: '',
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

    return {
      cities: cities.filter(i => i) as City['id'][],
      sources: sources.filter(i => i) as Source['id'][],
      pollutants: pollutants.filter(i => i) as Pollutant['id'][],
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
    return this.urlQuery.sources || []
  }

  private get filterPollutants (): Pollutant['id'][] {
    return this.urlQuery.pollutants || []
  }

  private get displayMode (): ChartDisplayModes|null {
    return this.urlQuery.display_mode || null
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

    const cities = await this.fetchCities()
    this.cities = cities
    this.setDefaults()

    await this.refreshChartData()

    this.isChartLoading = false
    this.$loader.off()
  }

  private setDefaults (): void {
    if (this.urlQuery.cities.length) {
      const idsMap = this.urlQuery.cities
        .reduce((memo: {[id: string]: number}, id: City['id']) => {
          memo[id] = 1
          return memo
        }, {})
      this.queryForm.cities = this.cities
        .filter(city => idsMap[city.id])
    } else if (this.cities[0]) {
      this.queryForm.cities = [this.cities[0]]
    }

    if ((this.urlQuery.date_start || 0) > 0) {
      this.queryForm.dateStart = this.urlQuery.date_start
    } else if (!this.queryForm.dateStart) {
      this.queryForm.dateStart = today
    }

    if ((this.urlQuery.date_end || 0) > 0) {
      this.queryForm.dateEnd = this.urlQuery.date_end
    } else if (!this.queryForm.dateEnd) {
      this.queryForm.dateEnd = today
    }

    if (this.urlQuery.display_mode) {
      this.pageProperties.displayMode = this.urlQuery.display_mode
    } else if (!this.queryForm.displayMode) {
      this.pageProperties.displayMode = ChartDisplayModes.NORMAL
    }

    if (!this.urlQuery.chart_cols) {
      this.urlQuery.chart_cols = MeasurementsChart.getDefaultChartCols(this.$vuetify)
    }

    this.pageProperties.chartColumnSize = this.urlQuery.chart_cols

    this.onChangeQueryForm()
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
    const measurements = await this.fetchMeasurements(this.queryForm)

    const pollutantsMap = measurements
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

    const sourcesMap = measurements
      .reduce((memo: {[sourceId: string]: Source}, meas: Measurement) => {
        if (meas.source && !memo[meas.source]) {
          const pollutant = POLLUTANTS.find(i => i.id === meas.pollutant)
          if (pollutant) {
            memo[meas.source] = {id: meas.source, label: meas.source}
          }
        }
        return memo
      }, {})
    const sources = _sortBy(Object.values(sourcesMap), 'id')

    const chartData = {
      cities: this.queryForm.cities.slice(),
      measurements: measurements,
      pollutants: pollutants,
      sources: sources,
    }
    return chartData
  }

  private async refreshChartData (): Promise<void> {
    this.isChartLoading = true

    const chartData = await this.fetchChartData()
    this.chartData = chartData
    this.pageProperties.sources = this.chartData.sources || []
    this.pageProperties.pollutants = this.chartData.pollutants || []

    let visibleSources = this.filterSources
      .filter(srcId => this.pageProperties.sources.find((s) => s.id === srcId))
    if (!visibleSources.length) {
      visibleSources = this.pageProperties.sources.length
        ? [this.pageProperties.sources[0]?.id]
        : []
    }
    this.pageProperties.visibleSources = visibleSources

    let visiblePollutants = this.filterPollutants
      .filter(pollId => this.pageProperties.pollutants.find((p) => p.id === pollId))
    if (!visiblePollutants.length) {
      visiblePollutants = this.pageProperties.pollutants.length
        ? [this.pageProperties.pollutants[0]?.id]
        : []
    }
    this.pageProperties.visiblePollutants = visiblePollutants

    this.urlQuery = {
      ...this.urlQuery,
      sources: visibleSources,
      pollutants: visiblePollutants,
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
      display_mode: data.displayMode
    }
  }

  private async onClickRefresh () {
    await this.refreshChartData()
  }
}
</script>
