<template>
<div class="view-violations fill-height" style="overflow: auto;">
  <v-container class="pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" md="5" lg="6" xl="6">
        <SelectBoxCities
          v-model="urlQuery.cities"
          :label="$t('cities')"
          :items="chartData.cities"
          :disabled="isLoading"
          @input="onChangeQuery(urlQuery)"
        />
      </v-col>

      <!-- <v-col
        class="d-flex justify-end justify-md-start align-center"
        cols="12"
        sm="6"
        md="2"
        offset-md="1"
        offset-lg="0"
      >
        <v-btn
          class="ml-3"
          :disabled="isLoading"
          :loading="isLoading || isChartLoading"
          @click="onClickRefresh"
          color="primary"
          small
        >
          {{ $t('refresh') }}
        </v-btn>
      </v-col> -->
    </v-row>
  </v-container>

  <v-container class="mt-4 px-8" fluid>
    <ViolationsRightDrawer
      :queryParams="urlQuery"
      :chartData="chartData"
      :open.sync="isRightPanelOpen"
      @update:queryParams="onChangeQuery"
    />

    <ViolationsChart
      ref="violationsChart"
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
import { Component, Vue } from 'vue-property-decorator'
import { ModuleState } from '@/store'
import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Organization from '@/entities/Organization'
import Target from '@/entities/Target'
import Violation from '@/entities/Violation'
import POLLUTANTS from '@/constants/pollutants.json'
import CityAPI from '@/api/CityAPI'
// import TargetAPI from '@/api/TargetAPI'
import ViolationAPI from '@/api/ViolationAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import { _toURLStringDate, _toNumberDate, _toQueryString } from '@/helpers'
import ViolationsChart from './components/ViolationsChart/ViolationsChart.vue'
import ViolationsRightDrawer from './components/ViolationsRightDrawer.vue'
import ChartData from './components/ViolationsChart/ChartData'
import URLQuery from './types/URLQuery'

// const today: string = _toURLStringDate(moment().format(URL_DATE_FORMAT))
const JAN_1: number = +moment(0).year(moment().year())

@Component({
  components: {
    ViolationsRightDrawer,
    SelectBoxCities,
    ViolationsChart,
  }
})
export default class ViewViolations extends Vue {
  private isLoading: boolean = false
  private isChartLoading: boolean = false

  private chartData: ChartData = {
    cities: [],
    violations: [],
    pollutants: [],
    organizations: [],
    targets: [],
  }

  private get urlQuery (): URLQuery {
    const q = this.$route.query

    const cities = Array.isArray(q.cities) ? q.cities : [q.cities]
    const pollutants = Array.isArray(q.pollutants) ? q.pollutants : [q.pollutants]
    const targets = Array.isArray(q.targets) ? q.targets : [q.targets]
    const organizations = Array.isArray(q.organizations) ? q.organizations : [q.organizations]
    const date_start = q.date_start
      ? _toURLStringDate(q.date_start as string)
      : ''

    return {
      cities: cities.filter(i => i) as City['id'][],
      pollutants: pollutants.filter(i => i) as Pollutant['id'][],
      targets: targets.filter(i => i) as Target['id'][],
      organizations: organizations.filter(i => i) as Organization['id'][],
      date_start,
    }
  }

  private set urlQuery (query: URLQuery) {
    const newPath = this.$router.resolve({
      ...(this.$route as any),
      query
    }).href

    this.$store.commit('SET', {key: 'queryForm.cities', value: query.cities})
    this.$store.commit('SET', {key: 'queryForm.dateStart', value: query.date_start})

    if (this.$route.fullPath !== newPath) this.$router.replace(newPath)
  }

  private get isRightPanelOpen (): boolean {
    return this.$store.getters.GET('ui.violations.isRightPanelOpen')
  }
  private set isRightPanelOpen (value: boolean) {
    this.$store.commit('SET', {key: 'ui.violations.isRightPanelOpen', value})
  }

  private get queryFormCached (): ModuleState['queryForm']|null {
    return this.$store.getters.GET('queryForm') || null
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
    this.chartData.cities = cities

    // set from cahce
    if (!this.urlQuery.cities.length && this.queryFormCached?.cities.length) {
      this.urlQuery = {
        ...this.urlQuery,
        cities: this.queryFormCached?.cities || []
      }
    }

    // filter only existing cities
    if (this.urlQuery.cities.length) {
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
      // this.queryForm.cities = [this.cities[0]]
      this.urlQuery = {
        ...this.urlQuery,
        cities: [cities[0].id]
      }
    }

    await this.refreshChartData()

    this.isChartLoading = false
    this.$loader.off()
  }

  private setQueryFormDefaults (): void {
    // const pageProperties = {...this.pageProperties}
    // const chartData = {...this.chartData}
    const urlQuery = {...this.urlQuery}
    // const queryForm = {...this.queryForm}

    // if (!urlQuery.chart_cols) {
    //   urlQuery.chart_cols = ViolationsChart.getDefaultChartCols(this.$vuetify)
    // }

    if (!urlQuery.date_start) {
      urlQuery.date_start = _toURLStringDate(JAN_1)
    }

    Object.assign(this.urlQuery, urlQuery)
    // Object.assign(this.queryForm, queryForm)
    // Object.assign(this.chartData, chartData)
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
    const promise = this.fetchViolations({
      city: this.urlQuery.cities,
      date_from: this.urlQuery.date_start,
      sort_by: 'asc(pollutant),asc(date)'
    })

    let [err, violations = []] = await to<Violation[]>(promise)
    console.log('violations: ', violations)

    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      throw err
    }

    // const targetsIds = Object.keys(violations
    //   .reduce((memo: {[targetId: string]: number}, item: Violation) => {
    //     if (!item.target_id) return memo
    //     if (!memo[item.target_id]) memo[item.target_id] = 1
    //     return memo
    //   }, {}))

    const pollutantsMap = violations
      .reduce((memo: {[pollutantId: string]: Pollutant}, item: Violation) => {
        if (item.pollutant && !memo[item.pollutant]) {
          const pollutant = POLLUTANTS.find(i => i.id === item.pollutant)
          if (pollutant) {
            memo[item.pollutant] = {...pollutant, unit: item.unit}
          } else {
            console.warn(`Unknown pollutant: ${item.pollutant}`)
          }
        }
        return memo
      }, {})
    const pollutants = _orderBy(Object.values(pollutantsMap), 'id')

    const organizationsMap = violations
      .reduce((memo: {[orgId: string]: Organization}, item: Violation) => {
        if (!item.organization) return memo
        if (memo[item.organization]) {
          memo[item.organization]._violationsNumber = 1 + (memo[item.organization]?._violationsNumber || 0)
        } else {
          memo[item.organization] = {
            id: item.organization,
            name: item.organization,
            cityId: item.location_id,
            _violationsNumber: 0,
          }
        }
        return memo
      }, {})
    const organizations = _orderBy(Object.values(organizationsMap), 'id')

    const chartData: ChartData = {
      cities: this.chartData.cities,
      violations,
      pollutants,
      organizations,
      targets: [],
    }
    return chartData
  }

  private async refreshChartData (): Promise<void> {
    this.isChartLoading = true

    const chartData = await this.fetchChartData()

    const allOrgs = chartData.organizations
    let visibleOrgs = this.urlQuery.organizations
      .filter(id => allOrgs.find((p) => p.id === id))
    if (!visibleOrgs.length) visibleOrgs = allOrgs.map(i => i.id)

    const allPollutants = chartData.pollutants
    let visiblePollutants = this.urlQuery.pollutants
      .filter(id => allPollutants.find((p) => p.id === id))
    if (!visiblePollutants.length) visiblePollutants = allPollutants.map(i => i.id)

    this.chartData = chartData
    this.urlQuery = {
      ...this.urlQuery,
      organizations: visibleOrgs,
      pollutants: visiblePollutants,
    }

    this.isChartLoading = false
  }

  private async fetchViolations (query: {
    city: string[]
    date_from?: string
    sort_by?: string
  }): Promise<Violation[]> {

    const [err, items] = await to(ViolationAPI.findAll(_toQueryString(query)))
    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return items || []
  }

  // private async fetchTargets (ids: Target['id'][]): Promise<Target[]> {
  //   const [err, items] = await to(TargetAPI.findAll({id: ids}))
  //   if (err) {
  //     this.$dialog.notify.error(
  //       err?.message || ''+this.$t('msg.something_went_wrong')
  //     )
  //     console.error(err)
  //     return []
  //   }
  //   return items || []
  // }

  private onChangeQuery (query: URLQuery) {
    this.urlQuery = query
  }

  // private onChangeQueryForm (queryForm: ViolationsQueryForm) {
  //   this.urlQuery = {
  //     ...this.urlQuery,
  //     cities: queryForm.cities.map(i => i.id),
  //     date_start: _toURLStringDate(queryForm.dateStart || 0),
  //   }
  // }

  // private onChangeChartData (data: ChartData) {
  //   // this.chartData = {...data}
  //   this.urlQuery = {
  //     ...this.urlQuery,
  //     date_start: _toURLStringDate(data.dateStart),
  //     // pollutants: data.visiblePollutants,
  //     // targets: data.visibleTargets,
  //     // organizations: data.visibleOrganizations,
  //   }
  // }

  // private async onClickRefresh () {
  //   this.$loader.on()

  //   const oldIds = [...this.urlQuery.cities]
  //     .sort((a, b) => a.localeCompare(b))
  //     .join(',')
  //   const newIds = [...this.queryForm.cities]
  //     .map(i => i.id)
  //     .sort((a, b) => a.localeCompare(b))
  //     .join(',')

  //   if (oldIds !== newIds) {
  //     this.onChangePageProperties({
  //       ...this.pageProperties,
  //       visibleSources: [],
  //     })
  //   }

  //   await this.refreshChartData()
  //   this.$loader.off()
  // }
}
</script>
