<template>
  <div
    class="view-map fill-height"
    style="overflow: auto;"
  >
    <v-container
      class="page-content fill-height pa-0"
      fluid
    >
      <MapRightDrawer
        :queryParams="urlQuery"
        :chartData="chartData"
        :open.sync="isRightPanelOpen"
        :loading="isChartLoading"
        @update:queryParams="onChangeQuery"
        @click:export="onClickExport"
      />

      <template v-if="urlQuery && urlQuery.pollutants && urlQuery.pollutants.length > LIMIT_FETCH_ITEMS_FROM_API">
        <v-alert
          class="text-center my-12 px-12"
          color="warning lighten-2"
        >
          <div class="d-flex justify-center">
            {{ $t('msg.limit_exceeded__server_cannot_process_amount__reduce_query') }}
          </div>

          <b class="d-flex justify-center pt-2">
            {{
              $t(
                'msg.queried_of_limit',
                {
                  queried: `${urlQuery.pollutants.length} ${$t('pollutants').toLowerCase()}`,
                  limit: `${LIMIT_FETCH_ITEMS_FROM_API} ${$t('pollutants').toLowerCase()}`,
                }
              )
            }}
          </b>
        </v-alert>
      </template>

      <MapChart
        v-else
        ref="map"
        class="fill-height"
        :queryParams="urlQuery"
        :chartData="chartData"
        :loading="isChartLoading"
        @click:markerAction="onClickMapMarkerAction"
        @update:queryParams="onChangeQuery"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import _orderBy from 'lodash.orderby'
import _difference from 'lodash.difference'
import {Component, Ref, Vue} from 'vue-property-decorator'
import config from '@/config'
import City from '@/entities/City'
import Station from '@/entities/Station'
import CityAPI from '@/api/CityAPI'
import StationAPI from '@/api/StationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import MapRightDrawer from './components/MapRightDrawer.vue'
import MapChart from './components/MapChart/MapChart.vue'
import ChartData from './components/MapChart/MapChartData'
import URLQuery, {
  MapChartBasemap,
  MapChartLevel,
  URLQueryRaw,
} from './types/URLQuery'
import {URLQueryRaw as MeasurementPageURLQueryRaw} from '@/views/measurement/types/URLQuery'
import {ExportFileType} from '@/components/ExportBtn.vue'
import Pollutant from '@/entities/Pollutant'

@Component({
  components: {
    SelectBoxCities,
    MapChart,
    MapRightDrawer,
  },
})
export default class ViewMap extends Vue {
  @Ref('map')
  readonly $map?: MapChart

  private isMounted: boolean = false
  private isFetched: boolean = false
  private isLoading: boolean = false
  private isChartLoading: boolean = false
  private readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  private chartData: ChartData = {
    cities: [],
    stations: [],
    pollutants: [],
  }

  private get urlQuery(): URLQuery {
    const q: URLQueryRaw = this.$route.query
    const _toLowerString = (
      itm: string | string[] | undefined
    ): string | undefined =>
      itm ? (String(itm) || '').toLowerCase() : undefined

    return {
      level: _toLowerString(q.lvl) as MapChartLevel | undefined,
      basemap: _toLowerString(q.bmap) as MapChartBasemap | undefined,
    }
  }

  private async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      lvl: inputQuery.level,
      bmap: inputQuery.basemap,
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

  private get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.map.isRightPanelOpen')
  }
  private set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.map.isRightPanelOpen', value})
  }

  // TODO: make it a mixin
  private created() {
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

  private async beforeMount() {
    this.isLoading = true
    await this.fetch()
    this.isFetched = true
    this.isLoading = false
  }

  private mounted() {
    this.isMounted = true
  }

  private async fetch() {
    this.$loader.on()
    this.isChartLoading = true

    await this.setUrlQueryDefaults()

    // let pollutants: Pollutant[] = []

    if (this.urlQuery.level === MapChartLevel.city) {
      const cities = await this.fetchCities()
      this.chartData.cities = cities
      this.chartData.pollutants = this.execPollutantsFromItems(cities)
    } else if (this.urlQuery.level === MapChartLevel.station) {
      const stations = await this.fetchStations()
      this.chartData.stations = stations
      // this.chartData.pollutants = this.execPollutantsFromItems(stations)
    }

    // filter only existing pollutants
    const pollutantsIdsMap =
      this.urlQuery.pollutants?.reduce(
        (memo: {[id: string]: number}, id: Pollutant['id']) => {
          memo[id] = 1
          return memo
        },
        {}
      ) || {}
    const existingPollutants = Object.keys(pollutantsIdsMap).length
      ? this.chartData.pollutants.filter((itm) => pollutantsIdsMap[itm.id])
      : []

    await this.setUrlQuery({
      ...this.urlQuery,
      pollutants: existingPollutants.map((i) => i.id),
    })

    this.$map?.refreshMapMarkers()
    this.isChartLoading = false
    this.$loader.off()
  }

  private async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    if (!urlQuery.level) {
      urlQuery.level = MapChartLevel.city
    }

    if (!urlQuery.basemap) {
      urlQuery.basemap = MapChartBasemap.terrain
    }

    await this.setUrlQuery(urlQuery)
  }

  private mountedAfterFetch() {}

  private async fetchCities(): Promise<City[]> {
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

  private async fetchStations(): Promise<Station[]> {
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

  private execPollutantsFromItems(items: City[]): Pollutant[] {
    const map = this.execPollutantsMapFromItems(items)
    const pollutants = _orderBy(Object.values(map), 'id')
    return pollutants
  }

  private execPollutantsMapFromItems(items: City[]): {
    [pollutantId: string]: Pollutant
  } {
    return {}
  }

  private async onChangeQuery(query: URLQuery) {
    const changedLvl = this.urlQuery.level !== query.level
    const changedBasemap = this.urlQuery.basemap !== query.basemap
    await this.setUrlQuery(query)
    if (changedLvl || changedBasemap) this.onClickRefresh()
  }

  private async onClickMapMarkerAction(item: City | Station) {
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

  private async onClickRefresh() {
    this.$loader.on()
    await this.fetch()
    this.$loader.off()
  }

  private onClickExport(fileType: ExportFileType) {
    if (fileType === ExportFileType.CSV) {
      this.onClickExportToCSV()
    }
  }

  // TODO: complete
  private onClickExportToCSV() {
    this.$dialog.notify.info(this.$tc('msg.will_be_added_soon').toString())
    // const citiesNames: string[] = this.urlQuery.cities
    //   .map(
    //     (cityId) =>
    //       this.chartData.cities.find((city) => city.id === cityId)?.name
    //   )
    //   .filter((i) => i) as string[]
    // this.exportToCSV(citiesNames, this.chartData.measurements)
  }

  private exportToCSV(locationsNames: string[], measurements: any[]) {
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
    // } catch (err) {
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
.view-map {
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