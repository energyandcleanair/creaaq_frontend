<template>
  <div
    class="view-violations fill-height"
    style="overflow: auto;"
  >
    <v-container
      class="pt-10 pt-md-4 px-8"
      fluid
    >
      <v-row>
        <v-col
          cols="12"
          sm="8"
          md="6"
        >
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

    <v-container
      class="mt-4 px-8"
      fluid
    >
      <ViolationsRightDrawer
        :queryParams="urlQuery"
        :chartData="chartData"
        :open.sync="isRightPanelOpen"
        :loading="isLoading || isChartLoading"
        @update:queryParams="onChangeQuery"
      />

      <template v-if="urlQuery && urlQuery.cities.length > LIMIT_FETCH_ITEMS_FROM_API">
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
                  queried: `${urlQuery.cities.length} ${$t('cities').toLowerCase()}`,
                  limit: `${LIMIT_FETCH_ITEMS_FROM_API} ${$t('cities').toLowerCase()}`,
                }
              )
            }}
          </b>
        </v-alert>
      </template>

      <ViolationsChart
        v-else
        :queryParams="urlQuery"
        :chartData="chartData"
        :loading="isChartLoading"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _orderBy from 'lodash.orderby'
import {Component, Vue} from 'vue-property-decorator'
import config from '@/config'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Guideline from '@/entities/Guideline'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'
import CityAPI from '@/api/CityAPI'
import TargetAPI from '@/api/TargetAPI'
import ViolationAPI from '@/api/ViolationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import {toURLStringDate, toQueryString, URL_DATE_FORMAT} from '@/utils'
import ViolationsChart from './components/ViolationsChart/ViolationsChart.vue'
import ViolationsRightDrawer from './components/ViolationsRightDrawer.vue'
import ChartData from './components/ViolationsChart/ChartData'
import URLQuery, {URLQueryRaw} from './types/URLQuery'

const JAN_1: number = +moment(0).year(moment().year())

@Component({
  components: {
    ViolationsRightDrawer,
    SelectBoxCities,
    ViolationsChart,
  },
})
export default class ViewViolations extends Vue {
  private isChartLoading: boolean = false
  private readonly LIMIT_FETCH_ITEMS_FROM_API: number =
    Number(config.get('LIMIT_FETCH_ITEMS_FROM_API')) || 100

  private chartData: ChartData = {
    cities: [],
    violations: [],
    pollutants: [],
    guidelines: [],
    targets: [],
  }

  private get isLoading(): boolean {
    return this.$loader.isLoadingProcess
  }

  private get urlQuery(): URLQuery {
    const q: URLQueryRaw = this.$route.query
    const _toArray = (itm: string | string[] | undefined) =>
      (Array.isArray(itm) ? itm : ([itm] as any[])).filter((i) => i)

    // TODO: delete
    // fallback for old URL format
    if (!q.ct && (q as any).cities) q.ct = (q as any).cities
    if (!q.pl && (q as any).pollutants) q.pl = (q as any).pollutants
    if (!q.tg && (q as any).targets) q.tg = (q as any).targets
    if (!q.gl && (q as any).guidelines) q.gl = (q as any).guidelines
    if (!q.start && (q as any).date_start) q.start = (q as any).date_start

    return {
      cities: _toArray(q.ct),
      pollutants: _toArray(q.pl),
      targets: _toArray(q.tg),
      guidelines: _toArray(q.gl),
      date_start: q.start ? toURLStringDate(q.start as string) : '',
    }
  }

  private async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      ct: inputQuery.cities,
      pl: _orderBy(inputQuery.pollutants),
      tg: _orderBy(inputQuery.targets),
      gl: _orderBy(inputQuery.guidelines),
      start: inputQuery.date_start
        ? toURLStringDate(inputQuery.date_start)
        : undefined,
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
      await this.$router.replace(newRoute.href)
    }
  }

  private get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.violations.isRightPanelOpen')
  }
  private set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.violations.isRightPanelOpen', value})
  }

  private get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }

  private beforeMount() {
    this.fetch()
  }

  private async fetch() {
    this.$loader.on()
    this.isChartLoading = true

    this.setUrlQueryDefaults()

    const cities = await this.fetchCities()
    this.chartData.cities = cities

    // set from cache
    if (!this.urlQuery.cities.length && this.queryFormCached?.cities.length) {
      await this.setUrlQuery({
        ...this.urlQuery,
        cities: this.queryFormCached?.cities || [],
      })
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

    if (!urlQuery.date_start) {
      urlQuery.date_start = toURLStringDate(JAN_1)
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
      violations: [],
      pollutants: [],
      guidelines: [],
      targets: [],
    }

    if (!this.urlQuery?.cities.length) return newChartData

    const promise = this.fetchViolations({
      city: this.urlQuery.cities,
      date_from: this.urlQuery.date_start,
      sort_by: 'asc(date)',
    })

    let [err, violations = []] = await to<Violation[]>(promise)

    if (err) {
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

    const promiseTargets = this.fetchTargets(targetsIds)

    let targets: Target[]
    ;[err, targets = []] = await to<Target[]>(promiseTargets)

    if (err) {
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    const pollutantsMap = targets.reduce(
      (memo: {[pollutantId: string]: Pollutant}, item: Target) => {
        const pollutantId = item.pollutant?.toLowerCase() || ''
        if (pollutantId && !memo[pollutantId]) {
          memo[pollutantId] = {
            id: pollutantId,
            label: pollutantId.toUpperCase(),
            unit: item.target_unit,
          }
        }
        return memo
      },
      {}
    )
    const pollutants = _orderBy(Object.values(pollutantsMap), 'id')

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

  private async fetchViolations(query: {
    city: string[]
    date_from?: string
    sort_by?: string
  }): Promise<Violation[]> {
    const $startDate = moment(query.date_from)
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

  private async fetchTargets(ids: Target['id'][]): Promise<Target[]> {
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

  private async onChangeQuery(query: URLQuery) {
    this.$loader.on()

    const citiesOld = [...this.urlQuery.cities].sort().join(',')
    const citiesNew = [...query.cities].sort().join(',')
    const citiesChanged = citiesOld !== citiesNew
    const needRefresh =
      query.date_start !== this.urlQuery.date_start || citiesChanged

    await this.setUrlQuery(query)
    if (needRefresh) return this.onClickRefresh()

    this.$loader.off()
  }

  private async onClickRefresh() {
    this.$loader.on()
    await this.refreshChartData()
    this.$loader.off()
  }
}
</script>
