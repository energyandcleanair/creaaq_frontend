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

      <v-container class="mt-4 px-8" fluid>
        <div
          v-if="urlQuery && urlQuery.cities.length > LIMIT_FETCH_ITEMS_FROM_API"
          class="view-violations__message-banner pa-12"
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

        <ViolationsChart
          :queryParams="urlQuery"
          :chartData="chartData"
          :loading="isChartLoading"
          :frozen="isKeepAliveInactive"
        />
      </v-container>
    </v-container>

    <ViolationsRightDrawer
      :queryParams="urlQuery"
      :chartData="chartData"
      :open.sync="isRightPanelOpen"
      :loading="isLoading || isChartLoading"
      @update:queryParams="onChangeQuery"
    />
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _orderBy from 'lodash.orderby'
import {Component, Mixins} from 'vue-property-decorator'
import {VueClass} from 'vue-class-component/lib/declarations'
import config from '@/config'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Guideline from '@/entities/Guideline'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'
import CityAPI from '@/api/CityAPI'
import PollutantAPI from '@/api/PollutantAPI'
import TargetAPI from '@/api/TargetAPI'
import ViolationAPI from '@/api/ViolationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import KeepAliveQueryMixin, {
  IKeepAliveQueryMixin,
} from '@/mixins/KeepAliveQuery'
import {toURLStringDate, toQueryString, URL_DATE_FORMAT} from '@/utils'
import ViolationsChart from './components/ViolationsChart/ViolationsChart.vue'
import ViolationsRightDrawer from './components/ViolationsRightDrawer.vue'
import ChartData from './components/ViolationsChart/ChartData'
import URLQuery, {URLQueryRaw} from './types/URLQuery'

const JAN_1: number = +moment(0).year(moment().year())
const _queryToArray = (itm: string | string[] | undefined) =>
  (Array.isArray(itm) ? itm : ([itm] as any[])).filter((i) => i)

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
  },
  metaInfo() {
    return {
      title: `${this.$t('violations')} - ${config.get('APP_PUBLIC_NAME')}`,
    }
  },
})
export default class ViewViolations extends Mixins(keepAliveQueryMixin) {
  public isChartLoading: boolean = false
  public readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  public chartData: ChartData = {
    cities: [],
    violations: [],
    pollutants: [],
    guidelines: [],
    targets: [],
  }

  public get isLoading(): boolean {
    return this.$loader.isLoadingProcess
  }

  public get urlQuery(): URLQuery {
    const q: URLQueryRaw = this.$route.query

    // TODO: delete
    // fallback for old URL format
    if (!q.ct && (q as any).cities) q.ct = (q as any).cities
    if (!q.pl && (q as any).pollutants) q.pl = (q as any).pollutants
    if (!q.tg && (q as any).targets) q.tg = (q as any).targets
    if (!q.gl && (q as any).guidelines) q.gl = (q as any).guidelines
    if (!q.start && (q as any).date_start) q.start = (q as any).date_start

    return {
      cities: _queryToArray(q.ct),
      pollutants: _queryToArray(q.pl),
      targets: _queryToArray(q.tg),
      guidelines: _queryToArray(q.gl),
      date_start: q.start ? toURLStringDate(q.start as string) : '',
      overshooting: q.ovshoot === 'true',
    }
  }

  public async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      ct: inputQuery.cities,
      pl: _orderBy(inputQuery.pollutants),
      tg: _orderBy(inputQuery.targets),
      gl: _orderBy(inputQuery.guidelines),
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
      violations: [],
      pollutants: [],
      guidelines: [],
      targets: [],
    }

    if (!this.urlQuery?.cities.length) return newChartData

    let [err, violations = []] = await to<Violation[]>(
      this.fetchViolations({
        city: this.urlQuery.cities,
        date_from: this.urlQuery.date_start,
        sort_by: 'asc(date)',
      })
    )
    if (err) {
      this.$trackGtmEvent('violations', 'error', err.message)
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const targetsIds = Object.keys(
      violations.reduce(
        (memo: {[targetId: string]: number}, item: Violation) => {
          if (!item.target_id) return memo
          if (!memo[item.target_id]) memo[item.target_id] = 1
          return memo
        },
        {}
      )
    )

    let targets: Target[]
    ;[err, targets = []] = await to<Target[]>(this.fetchTargets(targetsIds))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    let pollutants: Pollutant[]
    ;[err, pollutants = []] = await to<Pollutant[]>(this.fetchPollutants())
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const usedPollutantsMap = targets.reduce(
      (memo: {[pollutantId: string]: number}, item: Target) => {
        const pollutantId = item.pollutant
        if (pollutantId && !memo[pollutantId]) memo[pollutantId] = 1
        return memo
      },
      {}
    )
    pollutants = pollutants.filter((item) => usedPollutantsMap[item.id])

    const guidelinesMap = targets.reduce(
      (memo: {[guidelineId: string]: Guideline}, item: Target) => {
        if (!item.guideline) return memo
        if (memo[item.guideline]) {
          memo[item.guideline]._violationsNumber =
            1 + (memo[item.guideline]?._violationsNumber || 0)
        } else {
          memo[item.guideline] = {
            id: item.guideline,
            name: item.guideline,
            _violationsNumber: 0,
          }
        }
        return memo
      },
      {}
    )
    const guidelines = _orderBy(Object.values(guidelinesMap), 'id')

    newChartData.violations = violations
    newChartData.pollutants = pollutants
    newChartData.guidelines = guidelines
    newChartData.targets = targets
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

    const allGuidelines = chartData.guidelines
    let visibleGuidelines = this.urlQuery.guidelines.filter((id) =>
      allGuidelines.find((p) => p.id === id)
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

    this.chartData = chartData
    await this.setUrlQuery({
      ...this.urlQuery,
      guidelines: visibleGuidelines,
      pollutants: visiblePollutants,
      targets: visibleTargets,
    })

    this.isChartLoading = false
  }

  public async fetchViolations(query: {
    city: string[]
    date_from?: string
    sort_by?: string
  }): Promise<Violation[]> {
    const $startDate = moment(query.date_from || toURLStringDate(JAN_1))
    const q = {
      ...query,
      date_to: $startDate.month(11).date(31).format(URL_DATE_FORMAT),
    }

    const [err, items] = await to(ViolationAPI.findAll(toQueryString(q)))
    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  public async fetchTargets(ids: Target['id'][]): Promise<Target[]> {
    const [err, items] = await to(TargetAPI.findAll({id: ids.join(',')}))
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
    if (this.isKeepAliveInactive) return

    this.$loader.on()

    const citiesOld = [...this.urlQuery.cities].sort().join(',')
    const citiesNew = [...query.cities].sort().join(',')
    const citiesChanged = citiesOld !== citiesNew
    const needRefresh =
      query.date_start !== this.urlQuery.date_start || citiesChanged

    await this.setUrlQuery(query)
    if (needRefresh) return this.refresh()

    this.$loader.off()
  }

  public async onClickRefresh() {
    this.$trackGtmEvent('violations', 'refresh')
    this.refresh()
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
