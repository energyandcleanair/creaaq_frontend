<template>
<div class="view-stations fill-height" style="overflow: auto;">
  <v-container class="toolbar pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" sm="8" md="6">
        <SelectBoxCities
          :value="urlQuery.cities"
          :label="$t('cities')"
          :items="chartData.cities"
          :disabled="isLoading"
          @input="onChangeQuery({...urlQuery, cities: $event})"
        />
      </v-col>

      <v-col
        class="d-flex justify-end align-center"
        cols="12"
        sm="4"
        md="6"
      >
        <v-btn
          class="ml-2"
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

  <v-container class="page-content mt-4 px-8" fluid>
    <StationsChart
      ref="stationsChart"
      :queryParams="urlQuery"
      :chartData="chartData"
      :loading="isChartLoading"
      @update:queryParams="onChangeQuery"
    />
  </v-container>
</div>
</template>

<script lang="ts">
import to from 'await-to-js'
import _orderBy from 'lodash.orderby'
import _difference from 'lodash.difference'
import { Component, Ref, Vue } from 'vue-property-decorator'
import { ModuleState } from '@/store'
import City from '@/entities/City'
import Station from '@/entities/Station'
import CityAPI from '@/api/CityAPI'
import StationAPI from '@/api/StationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import { toQueryString } from '@/utils'
import StationsChart from './components/StationsChart/StationsChart.vue'
import ChartData from './components/StationsChart/ChartData'
import URLQuery from './types/URLQuery'

@Component({
  components: {
    SelectBoxCities,
    StationsChart,
  }
})
export default class ViewStations extends Vue {

  @Ref('stationsChart')
  readonly $stationsChart!: StationsChart

  private isMounted: boolean = false
  private isFetched: boolean = false
  private isLoading: boolean = false
  private isChartLoading: boolean = false

  private chartData: ChartData = {
    cities: [],
    stations: [],
  }

  private get urlQuery (): URLQuery {
    const q = this.$route.query

    const cities = Array.isArray(q.cities) ? q.cities : [q.cities]
    const stations = Array.isArray(q.stations) ? q.stations : [q.stations]

    return {
      cities: cities.filter(i => i) as City['id'][],
      stations: stations.filter(i => i) as Station['id'][],
    }
  }

  private set urlQuery (query: URLQuery) {
    const newPath = this.$router.resolve({
      ...(this.$route as any),
      query
    }).href

    this.$store.commit('SET', {key: 'queryForm.cities', value: query.cities})

    if (this.$route.fullPath !== newPath) this.$router.replace(newPath)
  }

  private get selectedCities (): City[] {
    if (!this.urlQuery.cities?.length) return []
    return this.chartData.cities
      .filter(itm => this.urlQuery.cities.includes(itm.id))
  }

  private get queryFormCached (): ModuleState['queryForm']|null {
    return this.$store.getters.GET('queryForm') || null
  }

  private created () {
    let cancelWatcherMounted: () => void = () => {}
    let cancelWatcherFetched: () => void = () => {}

    const check = () => this.isMounted &&
      this.isFetched &&
      this.mountedAfterFetch()

    cancelWatcherMounted = this.$watch(() => this.isMounted, () => {
      check()
      cancelWatcherMounted()
    })
    cancelWatcherFetched = this.$watch(() => this.isFetched, () => {
      check()
      cancelWatcherFetched()
    })
  }

  private async beforeMount () {
    this.isLoading = true
    await this.fetch()
    this.isFetched = true
    this.isLoading = false
  }

  private async fetch () {
    this.$loader.on()
    this.isChartLoading = true

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

    // filter only existing stations
    const stations = this.chartData.stations
    const stationsIdsMap = this.urlQuery.stations
      .reduce((memo: {[id: string]: number}, id: Station['id']) => {
        memo[id] = 1
        return memo
      }, {})
    const existingStations = stations.filter(itm => stationsIdsMap[itm.id])

    this.urlQuery = {
      ...this.urlQuery,
      stations: existingStations.map(i => i.id),
    }

    this.isChartLoading = false
    this.$loader.off()
  }

  private mounted () {
    this.isMounted = true
  }

  private mountedAfterFetch () {
    if (!this.urlQuery.stations?.length) {
      this.$stationsChart.fitAllMarkers()
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
    return _orderBy(cities || [], 'name')
  }

  private async fetchChartData (): Promise<ChartData> {
    const newChartData: ChartData = {
      cities: this.chartData.cities,
      stations: [],
    }

    if (!this.urlQuery?.cities.length) return newChartData

    const promise = this.fetchStations({city: this.urlQuery.cities})

    let [err, stations = []] = await to<Station[]>(promise)

    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      throw err
    }

    newChartData.stations = stations
    return newChartData
  }

  private async refreshChartData (): Promise<void> {
    this.isChartLoading = true
    const chartData = await this.fetchChartData()
    this.chartData = chartData
    this.isChartLoading = false
  }

  private async fetchStations (query: {
    city: string[]
  }): Promise<Station[]> {
    let [err, items = []] = await to(StationAPI.findAll(toQueryString(query)))
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

    this.urlQuery = query

    if (citiesChanged) this.onClickRefresh()
  }

  private async onClickRefresh () {
    this.$loader.on()
    await this.refreshChartData()
    this.$loader.off()
  }
}
</script>

<style lang="scss">
.view-stations {
  > .toolbar {
    position: relative;
    z-index: 5;
  }

  > .page-content {
    position: relative;
    z-index: 1;
  }
}
</style>