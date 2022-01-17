<template>
  <div class="view-stations fill-height" style="overflow: auto">
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
          class="d-flex justify-end align-start pt-8"
          cols="12"
          sm="4"
          md="6"
        >
          <v-btn
            class="ml-2"
            color="primary"
            :disabled="isLoading"
            :loading="isLoading || isChartLoading"
            @click="onClickRefresh"
          >
            <v-icon left>{{ mdiRefresh }}</v-icon>
            {{ $t('refresh') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="page-content mt-4 px-8" fluid>
      <div
        v-if="urlQuery && urlQuery.cities.length > LIMIT_FETCH_ITEMS_FROM_API"
        class="view-stations__message-banner pa-12"
      >
        <v-alert class="text-center my-12 px-12" color="warning lighten-2">
          <div class="d-flex justify-center">
            <span
              v-html="
                $t(
                  'msg.limit_exceeded__platform_cannot_display__you_can_download_data_by_url',
                  {url: getAPIQueryURL()}
                )
              "
            />
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

      <StationsChart
        ref="stationsChart"
        :queryParams="urlQuery"
        :chartData="chartData"
        :loading="isChartLoading"
        :frozen="isKeepAliveInactive"
        @update:queryParams="onChangeQuery"
        @click:copy_url="onClickCopyQueryURL"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import {mdiRefresh} from '@mdi/js'
import _orderBy from 'lodash.orderby'
import _difference from 'lodash.difference'
import clipboardCopy from 'clipboard-copy'
import {Component, Ref, Mixins} from 'vue-property-decorator'
import {VueClass} from 'vue-class-component/lib/declarations'
import config from '@/config'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Station from '@/entities/Station'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import CityAPI from '@/api/CityAPI'
import SourceAPI from '@/api/SourceAPI'
import PollutantAPI from '@/api/PollutantAPI'
import StationAPI, {StationQueryFindAll} from '@/api/StationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import KeepAliveQueryMixin, {
  IKeepAliveQueryMixin,
} from '@/mixins/KeepAliveQuery'
import {toQueryString, toCompactArray} from '@/utils'
import StationsChart from './components/StationsChart/StationsChart.vue'
import ChartData from './components/StationsChart/ChartData'
import URLQuery, {URLQueryRaw} from './types/URLQuery'

const keepAliveQueryMixin: VueClass<IKeepAliveQueryMixin> =
  KeepAliveQueryMixin<ViewStations>({
    hooksMap: {
      reload: 'init',
    },
    sharedQueryGetter(vm) {
      const localStorageQuery: ModuleState['queryForm'] | null =
        vm.$store.getters.GET('queryForm') || null
      const sharedQuery: URLQueryRaw = {
        ct: localStorageQuery?.cities || undefined,
      }
      return sharedQuery
    },
  })

@Component({
  name: 'ViewStations',
  components: {
    SelectBoxCities,
    StationsChart,
  },
  metaInfo() {
    return {
      title: `${this.$t('stations')} - ${config.get('APP_PUBLIC_NAME')}`,
    }
  },
})
export default class ViewStations extends Mixins(keepAliveQueryMixin) {
  @Ref('stationsChart')
  readonly $stationsChart?: StationsChart

  public readonly mdiRefresh = mdiRefresh
  public isMounted: boolean = false
  public isFetched: boolean = false
  public isLoading: boolean = false
  public isChartLoading: boolean = false
  public readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  public chartData: ChartData = {
    cities: [],
    stations: [],
    pollutants: [],
    sources: [],
  }

  public get urlQuery(): URLQuery {
    const q: URLQueryRaw = this.$route.query
    return {
      cities: toCompactArray(q.ct),
      stations: toCompactArray(q.st),
    }
  }

  public async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      ct: inputQuery.cities,
      st: inputQuery.stations,
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
      await this.$router.replace(newRoute.href, undefined, (err) =>
        console.error(err)
      )
      this.cacheCurrentRouteSnapshot()
    }
  }

  public get selectedCities(): City[] {
    if (!this.urlQuery.cities?.length) return []
    return this.chartData.cities.filter((itm) =>
      this.urlQuery.cities.includes(itm.id)
    )
  }

  public get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }

  // TODO: make it a mixin
  public created() {
    let cancelWatcherMounted: () => void = () => {}
    let cancelWatcherFetched: () => void = () => {}

    const check = () =>
      this.isMounted && this.isFetched && this.mountedAfterFetch()

    cancelWatcherMounted = this.$watch(
      () => this.isMounted,
      () => {
        check()
        cancelWatcherMounted()
      }
    )
    cancelWatcherFetched = this.$watch(
      () => this.isFetched,
      () => {
        check()
        cancelWatcherFetched()
      }
    )
  }

  public async beforeMount() {
    // see init()
  }

  public async init() {
    this.isLoading = true
    await to(this.fetch())
    this.cacheCurrentRouteSnapshot()
    this.isFetched = true
    this.isLoading = false
  }

  public async fetch() {
    this.$loader.on()
    this.isChartLoading = true

    await this.setUrlQueryDefaults()

    const promises: Promise<any>[] = []

    promises.push(
      this.fetchCities().then((items) => (this.chartData.cities = items))
    )

    promises.push(
      this.fetchSources().then((items) => (this.chartData.sources = items))
    )

    promises.push(
      this.fetchPollutants().then(
        (items) => (this.chartData.pollutants = items)
      )
    )

    const [err] = await to(Promise.all(promises))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

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
        ? this.chartData.cities.filter((city) => idsMap[city.id])
        : []

      await this.setUrlQuery({
        ...this.urlQuery,
        cities: existingCities.map((i) => i.id),
      })
    } else if (this.chartData.cities[0]) {
      await this.setUrlQuery({
        ...this.urlQuery,
        cities: [this.chartData.cities[0].id],
      })
    }

    await this.refreshChartData()

    // filter only existing stations
    const stations = this.chartData.stations
    const stationsIdsMap = this.urlQuery.stations.reduce(
      (memo: {[id: string]: number}, id: Station['id']) => {
        memo[id] = 1
        return memo
      },
      {}
    )
    const existingStations = Object.keys(stationsIdsMap).length
      ? stations.filter((itm) => stationsIdsMap[itm.id])
      : []

    await this.setUrlQuery({
      ...this.urlQuery,
      stations: existingStations.map((i) => i.id),
    })

    this.isChartLoading = false
    this.$loader.off()
  }

  public mounted() {
    this.isMounted = true
  }

  public mountedAfterFetch() {
    if (!this.urlQuery.stations?.length) {
      this.$stationsChart?.fitAllMarkers()
    }
  }

  public async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    // set from cache
    if (!urlQuery.cities.length && this.queryFormCached?.cities.length) {
      urlQuery.cities = this.queryFormCached.cities
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

  public async fetchChartData(): Promise<ChartData> {
    if ((this.urlQuery?.cities.length || 0) > this.LIMIT_FETCH_ITEMS_FROM_API) {
      this.$dialog.notify.warning(this.$t('msg.too_large_query').toString())
      this.$trackGtmEvent(
        'stations',
        'error_too_large_query',
        String(this.urlQuery?.cities.length)
      )
      throw new Error('exit')
    }

    const newChartData: ChartData = {
      cities: this.chartData.cities,
      sources: this.chartData.sources,
      pollutants: this.chartData.pollutants,
      stations: [],
    }

    if (!this.urlQuery?.cities.length) return newChartData

    const stationsQuery = this.getStationsQuery()
    let [err, stations = []] = await to<Station[]>(
      this.fetchStations(stationsQuery)
    )

    if (err) {
      this.$trackGtmEvent('stations', 'error', err.message)
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    // populate stations
    for (const station of stations) {
      if (station.source) {
        station._source = this.chartData.sources.find(
          (source) => station.source === source.id
        )
      }
      const polutantsSet = new Set(station.pollutants)
      station._pollutants = this.chartData.pollutants.filter((pollutant) =>
        polutantsSet.has(pollutant.id)
      )
    }

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

    this.chartData = chartData
    this.isChartLoading = false
  }

  public async fetchStations(query: StationQueryFindAll): Promise<Station[]> {
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

  public async onChangeQuery(query: URLQuery) {
    if (this.isKeepAliveInactive) return

    const citiesOld = [...this.urlQuery.cities].sort().join(',')
    const citiesNew = [...query.cities].sort().join(',')
    const citiesChanged = citiesOld !== citiesNew

    await this.setUrlQuery(query)

    if (citiesChanged) this.refresh()
  }

  public async onClickRefresh() {
    this.$trackGtmEvent('stations', 'refresh')
    this.refresh()
  }

  public async refresh() {
    this.$loader.on()
    await this.refreshChartData()
    this.$loader.off()
  }

  public onClickCopyQueryURL() {
    clipboardCopy(this.getAPIQueryURL())
    this.$dialog.notify.info(
      this.$t('msg.query_url_copied_to_clipboard').toString()
    )
  }

  public getAPIQueryURL(): string {
    const queryStr: string = toQueryString(this.getStationsQuery())
    const url = new URL(
      `${StationAPI.resourceURLPrefix}?${queryStr}`,
      StationAPI.axios.defaults.baseURL
    ).toString()
    return url
  }

  public getStationsQuery(): StationQueryFindAll {
    const query: StationQueryFindAll = {
      city: this.urlQuery.cities,
      format: 'json',
    }
    return query
  }
}
</script>

<style lang="scss">
.view-stations {
  overflow: auto;
  position: unset;

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
