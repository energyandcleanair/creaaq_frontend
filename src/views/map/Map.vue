<template>
  <div
    class="view-map fill-height"
    :class="{
      'right-panel-open': isRightPanelOpen,
    }"
  >
    <v-container class="page-content fill-height pa-0" fluid>
      <div
        v-if="
          urlQuery &&
          urlQuery.pollutants &&
          urlQuery.pollutants.length > LIMIT_FETCH_ITEMS_FROM_API
        "
        class="view-map__message-banner pa-12"
      >
        <v-alert class="text-center ma-0" color="warning lighten-2">
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
                queried: `${urlQuery.pollutants.length} ${$t('pollutants')
                  .toString()
                  .toLowerCase()}`,
                limit: `${LIMIT_FETCH_ITEMS_FROM_API} ${$t('pollutants')
                  .toString()
                  .toLowerCase()}`,
              })
            }}
          </b>
        </v-alert>
      </div>

      <MapChart
        ref="map"
        class="fill-height"
        :queryParams="urlQuery"
        :chartData="chartData"
        :loading="isChartLoading || isLoading"
        :frozen="isKeepAliveInactive"
        @click:markerAction="onClickMapMarkerAction"
        @update:queryParams="onChangeQuery"
      />
    </v-container>

    <MapRightDrawer
      :queryParams="urlQuery"
      :chartData="chartData"
      :open.sync="isRightPanelOpen"
      :loading="isChartLoading"
      @update:queryParams="onChangeQuery"
      @click:export="onClickExport"
    />
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import _orderBy from 'lodash.orderby'
import _debounce from 'lodash.debounce'
import _difference from 'lodash.difference'
import {Component, Ref, Mixins} from 'vue-property-decorator'
import config from '@/config'
import {sleep} from '@/utils'
import City from '@/entities/City'
import Station from '@/entities/Station'
import CityAPI from '@/api/CityAPI'
import StationAPI from '@/api/StationAPI'
import SourceAPI from '@/api/SourceAPI'
import PollutantAPI from '@/api/PollutantAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import {URLQueryRaw as MeasurementPageURLQueryRaw} from '@/views/measurement/types/URLQuery'
import {ExportFileType} from '@/components/ExportBtn.vue'
import Pollutant from '@/entities/Pollutant'
import Source from '@/entities/Source'
import KeepAliveQueryMixin from '@/mixins/KeepAliveQuery'
import MapRightDrawer from './components/MapRightDrawer.vue'
import MapChart from './components/MapChart/MapChart.vue'
import ChartData from './components/MapChart/MapChartData'
import URLQuery, {
  MapChartBasemap,
  MapChartLevel,
  URLQueryRaw,
} from './types/URLQuery'

const _queryToArray = (itm: string | string[] | undefined) =>
  (Array.isArray(itm) ? itm : ([itm] as any[])).filter((i) => i)

@Component({
  components: {
    SelectBoxCities,
    MapChart,
    MapRightDrawer,
  },
  metaInfo() {
    return {
      title: `${this.$t('map')} - ${config.get('APP_PUBLIC_NAME')}`,
    }
  },
})
export default class ViewMap extends Mixins(KeepAliveQueryMixin()) {
  @Ref('map')
  readonly $map?: MapChart

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
    const _toLowerString = (
      itm: string | string[] | undefined
    ): string | undefined =>
      itm ? (String(itm) || '').toLowerCase() : undefined

    return {
      level: _toLowerString(q.lvl) as MapChartLevel | undefined,
      basemap: _toLowerString(q.bmap) as MapChartBasemap | undefined,
      pollutants: _queryToArray(q.pl),
      sources: _queryToArray(q.sr),
    }
  }

  public async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      lvl: inputQuery.level,
      bmap: inputQuery.basemap,
      pl: inputQuery.pollutants,
      sr: inputQuery.sources,
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
      await this.$router.replace(newRoute.href)
    }
  }

  public get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.map.isRightPanelOpen')
  }
  public set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.map.isRightPanelOpen', value})
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
    this.isLoading = true
    await to(this.fetch())
    this.isFetched = true
    this.isLoading = false
  }

  public mounted() {
    this.isMounted = true
  }

  public async fetch() {
    this.$loader.on()
    this.isChartLoading = true

    await this.setUrlQueryDefaults()

    if (
      (this.urlQuery?.pollutants?.length || 0) > this.LIMIT_FETCH_ITEMS_FROM_API
    ) {
      this.isChartLoading = false
      this.$loader.off()
      this.$dialog.notify.warning(this.$t('msg.too_large_query').toString())
      this.$trackGtmEvent(
        'violations',
        'error_too_large_query',
        String(this.urlQuery?.pollutants?.length || 0)
      )
      throw new Error('exit')
    }

    let err: any
    let pollutants: Pollutant[]
    ;[err, pollutants = []] = await to<Pollutant[]>(this.fetchPollutants())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    let sources: Source[]
    ;[err, sources = []] = await to<Source[]>(this.fetchSources())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    if (this.urlQuery.level === MapChartLevel.city) {
      const cities = await this.fetchCities()
      this.chartData.cities = cities
      this.chartData.pollutants = this.filterUsedPollutantsFromItems(
        pollutants,
        cities
      )
      this.chartData.sources = this.filterUsedSourcesFromItems(sources, cities)
    } else if (this.urlQuery.level === MapChartLevel.station) {
      const stations = await this.fetchStations()
      this.chartData.stations = stations
      this.chartData.pollutants = this.filterUsedPollutantsFromItems(
        pollutants,
        stations
      )
      this.chartData.sources = this.filterUsedSourcesFromItems(
        sources,
        stations
      )
    }

    // filter only existing pollutants
    const queryPollutantsIdsMap = (this.urlQuery.pollutants || []).reduce(
      (memo: {[id: string]: number}, id: Pollutant['id']) => {
        memo[id] = 1
        return memo
      },
      {}
    )
    let visiblePollutants = Object.keys(queryPollutantsIdsMap).length
      ? this.chartData.pollutants.filter((itm) => queryPollutantsIdsMap[itm.id])
      : []
    if (!visiblePollutants.length) visiblePollutants = this.chartData.pollutants

    // filter only existing sources
    const querySourcesIdsMap = (this.urlQuery.sources || []).reduce(
      (memo: {[id: string]: number}, id: Pollutant['id']) => {
        memo[id] = 1
        return memo
      },
      {}
    )
    let visibleSources = Object.keys(querySourcesIdsMap).length
      ? this.chartData.sources.filter((itm) => querySourcesIdsMap[itm.id])
      : []
    if (!visibleSources.length && this.chartData.sources[0]) {
      visibleSources = [this.chartData.sources[0]]
    }

    await this.setUrlQuery({
      ...this.urlQuery,
      pollutants: visiblePollutants.map((i) => i.id),
      sources: visibleSources.map((i) => i.id),
    })

    this.$map?.refreshMapMarkers()
    this.isChartLoading = false
    this.$loader.off()
  }

  public async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    if (!urlQuery.level) {
      urlQuery.level = MapChartLevel.city
    }

    if (!urlQuery.basemap) {
      urlQuery.basemap = MapChartBasemap.terrain
    }

    await this.setUrlQuery(urlQuery)
  }

  public mountedAfterFetch() {}

  public async fetchCities(): Promise<City[]> {
    const [err, cities] = await to(CityAPI.findAll({count: 10}))
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

  public async fetchStations(): Promise<Station[]> {
    let [err, items = []] = await to(StationAPI.findAll())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }

    return items || []
  }

  public filterUsedPollutantsFromItems(
    pollutants: Pollutant[],
    items: (City | Station)[]
  ): Pollutant[] {
    const usedPollutantsSet = this.execPollutantsSetFromItems(items)
    return pollutants.filter((item) => usedPollutantsSet.has(item.id))
  }

  public execPollutantsSetFromItems(
    items: (City | Station)[] = []
  ): Set<Pollutant['id']> {
    return items.reduce((set: Set<Pollutant['id']>, item: Station | City) => {
      const pollutantsIds: string[] = item.pollutants || []
      for (const pollutantId of pollutantsIds) {
        if (pollutantId && !set.has(pollutantId)) set.add(pollutantId)
      }
      return set
    }, new Set<Pollutant['id']>())
  }

  public filterUsedSourcesFromItems(
    sources: Source[],
    items: (Station | City)[]
  ): Source[] {
    const usedSourcesSet = this.execSourcesSetFromStations(items)
    return sources.filter((item) => usedSourcesSet.has(item.id))
  }

  public execSourcesSetFromStations(
    items: (Station | City)[] = []
  ): Set<Source['id']> {
    return items.reduce((set: Set<Source['id']>, item: Station | City) => {
      let sourcesIds: string[] = []
      if ((item as Station).level === 'station' && (item as Station).source) {
        sourcesIds = [(item as Station).source as string]
      } else if ((item as City).level === 'city') {
        sourcesIds = (item as City).sources || []
      }
      for (const sourceId of sourcesIds) {
        if (sourceId && !set.has(sourceId)) set.add(sourceId)
      }
      return set
    }, new Set<Source['id']>())
  }

  public get onChangeQuery() {
    return _debounce(async (query: URLQuery) => {
      if (this.isKeepAliveInactive) return

      this.isChartLoading = true

      await sleep(0)

      const changedLvl = this.urlQuery.level !== query.level
      const changedSources =
        this.urlQuery.sources?.join(',') !== query.sources?.join(',')

      await this.setUrlQuery(query)

      if (changedLvl) {
        await this.onClickRefresh()
      } else if (changedSources) {
        await this.$map?.refreshMapMarkers()
      }

      await sleep(1000)
      this.isChartLoading = false
    }, 300)
  }

  public async onClickMapMarkerAction(item: City | Station) {
    this.isChartLoading = true

    if ((item as City).level === 'city') {
      const query: MeasurementPageURLQueryRaw = {
        ct: [item.id],
      }
      this.$router.push({name: 'measurements', query: query as any})
    } else if ((item as Station).level === 'station') {
      const query: MeasurementPageURLQueryRaw = {
        ct: [(item as Station).city_id],
        st: [item.id],
      }
      this.$router.push({name: 'measurements', query: query as any})
    } else {
      console.error('Unknown marker level', item)
    }
  }

  public async onClickRefresh() {
    this.$loader.on()
    await this.fetch()
    this.$loader.off()
  }

  public onClickExport(fileType: ExportFileType) {
    if (fileType === ExportFileType.CSV) {
      this.onClickExportToCSV()
    }
  }

  // TODO: complete
  public onClickExportToCSV() {
    this.$dialog.notify.info(this.$tc('msg.will_be_added_soon').toString())
    // const citiesNames: string[] = this.urlQuery.cities
    //   .map(
    //     (cityId) =>
    //       this.chartData.cities.find((city) => city.id === cityId)?.name
    //   )
    //   .filter((i) => i) as string[]
    // this.exportToCSV(citiesNames, this.chartData.measurements)
  }

  public exportToCSV(locationsNames: string[], measurements: any[]) {
    // this.$loader.on()
    // let items: Measurement[] = []
    // if (this.urlQuery.stations?.length) {
    //   items = measurements.filter(
    //     (item) => item.process_id === MeasurementProcesses.station_day_mad
    //   )
    // } else {
    //   items = measurements.filter(
    //     (item) => item.process_id === MeasurementProcesses.city_day_mad
    //   )
    // }
    // const dateStart = toNumberDate(this.urlQuery.date_start || '0')
    // const dateEnd = toNumberDate(this.urlQuery.date_end || '0')
    // const interval = DatesIntervalInput.determineInterval(dateStart, dateEnd)
    // const dates = DatesIntervalInput.formatValue(
    //   interval,
    //   dateStart,
    //   dateEnd,
    //   'YYYY-MM-DD'
    // )
    //   .toLowerCase()
    //   .replace(/<.+?>/g, '')
    //   .replace(/\s/g, '_')
    // const filename = `measurements.${locationsNames.join(
    //   '+'
    // )}.${dates}.csv`.replace(/\s/g, '')
    // const fields: string[] = Object.keys({
    //   ...(items[0] || {}),
    //   id: 1,
    //   name: 1,
    //   country_id: 1,
    //   location_id: 1,
    //   city_id: 1,
    //   source: 1,
    //   date: 1,
    //   level: 1,
    //   value: 1,
    //   unit: 1,
    //   pollutant: 1,
    //   names: 1,
    //   gpw: 1,
    //   timezone: 1,
    //   process_id: 1,
    //   gadm1_id: 1,
    //   name_local: 1,
    //   geometry: 1,
    // })
    // const opts = {
    //   fields,
    //   header: true,
    //   quote: '"',
    //   delimiter: ',',
    // }
    // try {
    //   const csv = json2csv.parse(items, opts)
    //   const blob = new Blob([csv], {type: 'application/csvcharset=utf-8'})
    //   saveAs(blob, filename)
    //   this.$loader.off()
    // } catch (err: any) {
    //   this.$loader.off()
    //   console.error(err)
    //   this.$dialog.notify.error(
    //     err?.message || err || '' + this.$t('msg.something_went_wrong')
    //   )
    //   throw err
    // }
  }
}
</script>

<style lang="scss">
$right_panel--width: 250px;

.view-map {
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
