<template>
  <div
    class="view-violations fill-height"
    :class="{
      'right-panel-open': isRightPanelOpen,
    }"
  >
    <v-container
      class="page-content fill-height pa-0 align-content-start"
      fluid
    >
      <v-container class="pt-10 pt-md-4 px-8" style="z-index: 15" fluid>
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

          <v-col class="d-flex justify-end align-start pt-7 pl-3">
            <v-list-item
              class="px-2 mr-2"
              dense
              style="flex: 0 1 auto; height: 36px"
              :title="$t('auto_refresh_on_query_change')"
              @click="isAutoRefreshOnQueryChange = !isAutoRefreshOnQueryChange"
            >
              <v-list-item-action class="mr-1 my-2">
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
        <div
          v-if="isCitiesLimitExceeded"
          class="view-violations__message-banner pa-12"
        >
          <v-alert class="text-center my-12 px-12" color="warning lighten-2">
            <div class="d-flex justify-center">
              <span
                v-html="
                  $t(
                    'msg.limit_exceeded__platform_cannot_display__you_can_download_data_by_url'
                  )
                "
              />
            </div>

            <v-btn
              class="mt-2"
              small
              outlined
              color="black"
              target="_blank"
              :href="getAPIQueryURL()"
            >
              <v-icon left>{{ mdiApi }}</v-icon>
              {{ $t('download') }}
            </v-btn>

            <b class="d-flex justify-center pt-5 pb-1">
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

        <ViolationsChart
          :queryParams="urlQuery"
          :chartData="chartData"
          :loading="isChartLoading"
          :frozen="isKeepAliveInactive"
          :outdatedState="
            !isAutoRefreshOnQueryChange &&
            isChartStateOutdated &&
            !isCitiesLimitExceeded
          "
          @click:refresh="onClickRefresh"
        />
      </v-container>
    </v-container>

    <ViolationsRightDrawer
      :queryParams="urlQuery"
      :chartData="chartData"
      :open.sync="isRightPanelOpen"
      :loading="isLoading || isChartLoading"
      @update:queryParams="onChangeQuery"
      @click:copy_url="onClickCopyQueryURL"
    />
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _orderBy from 'lodash.orderby'
import clipboardCopy from 'clipboard-copy'
import {Component, Mixins} from 'vue-property-decorator'
import {VueClass} from 'vue-class-component/lib/declarations'
import {mdiRefresh, mdiApi} from '@mdi/js'
import config from '@/config'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'
import Regulation from '@/entities/Regulation'
import Country from '@/entities/Country'
import Source from '@/entities/Source'
import CityAPI from '@/api/CityAPI'
import PollutantAPI from '@/api/PollutantAPI'
import RegulationAPI from '@/api/RegulationAPI'
import SourceAPI from '@/api/SourceAPI'
import TargetAPI from '@/api/TargetAPI'
import ViolationAPI, {ViolationQueryFindAll} from '@/api/ViolationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import PageDrawerHandlerBtn from '@/components/PageDrawer/PageDrawerHandlerBtn.vue'
import KeepAliveQueryMixin, {
  IKeepAliveQueryMixin,
} from '@/mixins/KeepAliveQuery'
import {
  toURLStringDate,
  toCompactArray,
  URL_DATE_FORMAT,
  toQueryString,
} from '@/utils'
import ViolationsChart from './components/ViolationsChart/ViolationsChart.vue'
import ViolationsRightDrawer from './components/ViolationsRightDrawer.vue'
import ChartData from './components/ViolationsChart/ChartData'
import URLQuery, {URLQueryRaw} from './types/URLQuery'

const JAN_1: number = +moment(0).year(moment().year())

const keepAliveQueryMixin: VueClass<IKeepAliveQueryMixin> =
  KeepAliveQueryMixin<ViewViolations>({
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
  name: 'ViewViolations',
  components: {
    ViolationsRightDrawer,
    SelectBoxCities,
    ViolationsChart,
    PageDrawerHandlerBtn,
  },
  metaInfo() {
    return {
      title: `${this.$t('violations')} - ${config.get('APP_PUBLIC_NAME')}`,
    }
  },
})
export default class ViewViolations extends Mixins(keepAliveQueryMixin) {
  public isChartLoading: boolean = false
  public isChartStateOutdated: boolean = false
  public readonly mdiRefresh = mdiRefresh
  public readonly mdiApi = mdiApi
  public readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  public chartData: ChartData = {
    cities: [],
    countriesMap: new Map<Country['id'], Country>(),
    violations: [],
    pollutants: [],
    regulations: [],
    targets: [],
    sources: [],
    usedSources: [],
  }

  public get isLoading(): boolean {
    return this.$loader.isLoadingProcess
  }

  public get isCitiesLimitExceeded(): boolean {
    return (
      this.urlQuery &&
      this.urlQuery.cities.length > this.LIMIT_FETCH_ITEMS_FROM_API
    )
  }

  public get urlQuery(): URLQuery {
    const q: URLQueryRaw = this.$route.query
    return {
      cities: toCompactArray(q.ct),
      pollutants: toCompactArray(q.pl),
      targets: toCompactArray(q.tg),
      regulations: toCompactArray(q.rg),
      sources: toCompactArray(q.sr),
      date_start: q.start ? toURLStringDate(q.start as string) : '',
      overshooting: q.ovshoot === 'true',
    }
  }

  public async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      ct: inputQuery.cities,
      pl: _orderBy(inputQuery.pollutants),
      tg: _orderBy(inputQuery.targets),
      rg: _orderBy(inputQuery.regulations),
      sr: inputQuery.sources,
      start: inputQuery.date_start
        ? toURLStringDate(inputQuery.date_start)
        : undefined,
      ovshoot: inputQuery.overshooting === true ? 'true' : undefined,
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
      await this.$router.replace(newRoute.href, undefined, (err) =>
        console.error(err)
      )
      this.cacheCurrentRouteSnapshot()
    }
  }

  public get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.violations.isRightPanelOpen')
  }
  public set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.violations.isRightPanelOpen', value})
  }

  public get isAutoRefreshOnQueryChange(): boolean {
    return this.$store.getters.GET('ui.violations.isAutoRefreshOnQueryChange')
  }
  public set isAutoRefreshOnQueryChange(value: boolean) {
    this.$store.commit('SET', {
      key: 'ui.violations.isAutoRefreshOnQueryChange',
      value,
    })
  }

  public get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }

  public beforeMount() {
    // see init()
  }

  public async init() {
    await this.fetch()
    this.cacheCurrentRouteSnapshot()
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

    const promises: Promise<any>[] = []

    promises.push(
      this.fetchCities()
        .then((items) => (this.chartData.cities = items))
        .then((cities) => {
          this.chartData.countriesMap = cities.reduce(
            (map: Map<Country['id'], Country>, city: City) => {
              map.set(city.country_id, {
                id: city.country_id,
                name: city.country_name,
                level: 'country',
              })
              return map
            },
            new Map<Country['id'], Country>()
          )
        })
    )

    promises.push(
      this.fetchSources().then(
        (items) => (this.chartData.sources = _orderBy(items, 'id'))
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
      const idsSet = new Set<City['id']>(this.urlQuery.cities)
      const existingCities = idsSet.size
        ? this.chartData.cities.filter((city) => idsSet.has(city.id))
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

    this.isChartLoading = false
    this.$loader.off()
  }

  public async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    // set from cache
    if (!urlQuery.cities.length && this.queryFormCached?.cities.length) {
      urlQuery.cities = this.queryFormCached.cities
    }

    if (!urlQuery.date_start) {
      urlQuery.date_start = toURLStringDate(JAN_1)
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
        'violations',
        'error_too_large_query',
        String(this.urlQuery?.cities.length)
      )
      throw new Error('exit')
    }

    const newChartData: ChartData = {
      cities: this.chartData.cities,
      countriesMap: this.chartData.countriesMap,
      sources: this.chartData.sources,
      violations: [],
      pollutants: [],
      regulations: [],
      targets: [],
      usedSources: [],
    }

    if (!this.urlQuery?.cities.length) return newChartData

    const promises: Promise<any>[] = []

    const violationsQuery = this.getViolationsQuery()
    promises.push(
      this.fetchViolations(violationsQuery).then((violations = []) => {
        newChartData.violations = violations
      })
    )

    promises.push(
      this.fetchRegulations({city: this.urlQuery.cities})
        .then((regulations = []) => {
          newChartData.regulations = regulations

          const regulationIds: Regulation['id'][] = Array.from(
            regulations.map((item) => item.id)
          )
          return this.fetchTargets({regulation_id: regulationIds})
        })
        .then((targets = []) => {
          newChartData.targets = targets
        })
    )

    promises.push(
      this.fetchPollutants().then((pollutants = []) => {
        newChartData.pollutants = pollutants
      })
    )

    const [err] = await to(Promise.all(promises))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const usedPollutantsSet = newChartData.targets.reduce(
      (set: Set<Pollutant['id']>, item: Target) => {
        if (!item?.pollutant) return set
        return set.add(item.pollutant)
      },
      new Set<Pollutant['id']>()
    )

    newChartData.pollutants = newChartData.pollutants.filter((item) =>
      usedPollutantsSet.has(item.id)
    )

    const usedSourcesSet = new Set<Source['id']>()

    // populate with sources
    for (const violation of newChartData.violations) {
      if (violation.source) {
        violation._source = this.chartData.sources.find(
          (source) => violation.source === source.id
        )
        if (violation._source && !usedSourcesSet.has(violation._source.id)) {
          usedSourcesSet.add(violation._source.id)
          newChartData.usedSources.push(violation._source)
        }
      }
    }

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

    const allRegulations = chartData.regulations
    let visibleRegulations = this.urlQuery.regulations.filter((id) =>
      allRegulations.find((p) => p.id === id)
    )

    const allPollutants = chartData.pollutants
    let visiblePollutants = this.urlQuery.pollutants.filter((id) =>
      allPollutants.find((p) => p.id === id)
    )

    const allTargets = chartData.targets
    let visibleTargets = this.urlQuery.targets.filter((id) =>
      allTargets.find((p) => p.id === id)
    )
    if (!visibleTargets.length) visibleTargets = allTargets.map((i) => i.id)

    const allSources = chartData.usedSources

    this.chartData = chartData
    await this.setUrlQuery({
      ...this.urlQuery,
      regulations: visibleRegulations,
      pollutants: visiblePollutants,
      targets: visibleTargets,
      sources: allSources.map((i) => i.id),
    })

    this.isChartLoading = false
    this.isChartStateOutdated = false
  }

  public async fetchViolations(
    query: ViolationQueryFindAll
  ): Promise<Violation[]> {
    const [err, items] = await to(ViolationAPI.findAll(query))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  public async fetchTargets(query: {
    regulation_id?: string[]
  }): Promise<Target[]> {
    const [err, items] = await to(TargetAPI.findAll(query))
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

  public async fetchRegulations(query: {
    city?: string[]
  }): Promise<Regulation[]> {
    let [err, items = []] = await to(RegulationAPI.findAll(query))
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
    const needRefresh =
      query.date_start !== this.urlQuery.date_start || citiesChanged
    this.isChartStateOutdated = needRefresh || this.isChartStateOutdated

    await this.setUrlQuery(query)

    if (this.isAutoRefreshOnQueryChange && needRefresh) return this.refresh()
  }

  public async onClickRefresh() {
    this.$trackGtmEvent('violations', 'refresh')
    this.refresh()
  }

  public onClickCopyQueryURL() {
    clipboardCopy(this.getAPIQueryURL())
    this.$dialog.notify.info(
      this.$t('msg.query_url_copied_to_clipboard').toString()
    )
  }

  public getAPIQueryURL(): string {
    const queryStr: string = toQueryString(this.getViolationsQuery())
    const url = new URL(
      `${ViolationAPI.resourceURLPrefix}?${queryStr}`,
      ViolationAPI.axios.defaults.baseURL
    ).toString()
    return url
  }

  public getViolationsQuery(): ViolationQueryFindAll {
    const $startDate = moment(
      this.urlQuery.date_start || toURLStringDate(JAN_1)
    )
    const dateEnd = $startDate.month(11).date(31).format(URL_DATE_FORMAT)

    const query: ViolationQueryFindAll = {
      city: this.urlQuery.cities,
      date_from: this.urlQuery.date_start,
      date_to: dateEnd,
      sort_by: ['asc(date)'],
      format: 'json',
    }
    return query
  }
}
</script>


<style lang="scss">
$right_panel--width: 250px;

.view-violations {
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
