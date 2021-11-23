<template>
  <div class="view-download fill-height" style="overflow: auto">
    <v-container class="pt-10 pt-md-10 px-8" fluid>
      <v-row>
        <v-col class="text-center">
          <h1 class="text-h3 mb-4">{{ $t('download') }}</h1>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-btn-toggle
            class="d-flex row ma-0"
            :value="urlQuery.entity"
            color="secondary"
            group
            tile
            :disabled="isLoading"
            @change="onChangeQuery({...urlQuery, entity: $event})"
          >
            <v-btn
              v-for="option of targetEntityOptions"
              :key="option.value"
              class="col col-12 col-md-4 ma-0"
              :value="option.value"
            >
              {{ option.label }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-1 mb-2">{{ $t('cities') }}</div>

          <SelectBoxCities
            :value="urlQuery.cities"
            :items="pageData.cities"
            :disabled="isLoading"
            @input="onChangeQuery({...urlQuery, cities: $event})"
          />
        </v-col>
      </v-row>

      <v-row v-if="formHasDates">
        <v-col cols="12" md="6">
          <div class="text-subtitle-1 mb-2">{{ $t('dates') }}</div>

          <DatesIntervalInput
            class="pt-0"
            :dateStart="toNumberDate(urlQuery.date_start || '')"
            :dateEnd="toNumberDate(urlQuery.date_end || '')"
            format="YYYY-MM-DD"
            :disabled="isLoading"
            @input="
              onChangeQuery({
                ...urlQuery,
                date_start: toURLStringDate($event.dateStart),
                date_end: toURLStringDate($event.dateEnd),
              })
            "
          />
        </v-col>
      </v-row>

      <v-row v-if="formHasRunningAverage">
        <v-col cols="12" md="6">
          <div class="text-subtitle-1 mb-2">{{ $t('averaging') }}</div>

          <v-btn-toggle
            :value="urlQuery.averaging_period"
            color="secondary"
            tile
            group
            @change="onChangeQuery({...urlQuery, averaging_period: $event})"
          >
            <v-btn
              class="px-1"
              v-for="val of AVERAGING_PERIOD_OPTIONS"
              :key="val"
              :value="val"
              v-text="val"
              small
              style="text-transform: none"
            />
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-1 mb-2">{{ $t('format') }}</div>

          <v-btn-toggle
            class="d-flex row ma-0"
            :value="urlQuery.format"
            color="secondary"
            group
            tile
            :disabled="isLoading"
            @change="onChangeQuery({...urlQuery, format: $event})"
          >
            <v-btn
              v-for="option of formatOptions"
              :key="option.value"
              class="col col-6 ma-0"
              :value="option.value"
            >
              {{ option.label }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col class="d-flex justify-center" cols="12" md="6">
          <v-btn
            color="primary"
            :disabled="isLoading"
            :loading="isLoading"
            large
            @click="onClickDownload"
          >
            <v-icon left>{{ mdiDownload }}</v-icon>
            {{ $t('download') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import moment from 'moment'
import to from 'await-to-js'
import _orderBy from 'lodash.orderby'
import _difference from 'lodash.difference'
import {Component, Vue} from 'vue-property-decorator'
import {mdiDownload} from '@mdi/js'
import {ModuleState} from '@/store'
import City from '@/entities/City'
import Station from '@/entities/Station'
import CityAPI from '@/api/CityAPI'
import StationAPI from '@/api/StationAPI'
import PollutantAPI from '@/api/PollutantAPI'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import DatesIntervalInput from '@/components/DatesIntervalInput/DatesIntervalInput.vue'
import {
  toQueryString,
  toNumberDate,
  toURLStringDate,
  URL_DATE_FORMAT,
} from '@/utils'
import URLQuery, {
  URLQueryAggregation,
  URLQueryAveragingPeriod,
  URLQueryFormat,
  URLQueryTargetEntity,
} from './types/URLQuery'
import PageData from './types/PageData'
import Pollutant from '@/entities/Pollutant'

const today: string = toURLStringDate(moment().format(URL_DATE_FORMAT))
const JAN_1__THREE_YEARS_AGO: number = +moment(0).year(moment().year() - 2)

@Component({
  components: {
    SelectBoxCities,
    DatesIntervalInput,
  },
})
export default class ViewDownload extends Vue {
  public isLoading: boolean = false
  public URLQueryTargetEntity = URLQueryTargetEntity
  public mdiDownload = mdiDownload

  public pageData: PageData = {
    cities: [],
    measurements: [],
    pollutants: [],
    // sources: [],
    stations: [],
  }

  public get urlQuery(): URLQuery {
    return URLQuery.parseFromURLString(this.$route.fullPath)
  }

  public set urlQuery(queryForm: URLQuery) {
    this.setUrlQuery(queryForm)
  }

  public async setUrlQuery(newQuery: URLQuery): Promise<void> {
    const query = URLQuery.toRawQueryObject(newQuery, {positive: true})
    const newRoute = this.$router.resolve({
      ...(this.$route as any),
      query,
    })

    if (this.$route.fullPath !== newRoute.href) {
      await this.$router.replace(newRoute.href)
    }
  }

  public get formHasAggregation(): boolean {
    return this.urlQuery.entity === URLQueryTargetEntity.measurement
  }

  public get formHasRunningAverage(): boolean {
    return this.urlQuery.entity === URLQueryTargetEntity.measurement
  }

  public get formHasDates(): boolean {
    return (
      this.urlQuery.entity === URLQueryTargetEntity.measurement ||
      this.urlQuery.entity === URLQueryTargetEntity.violation
    )
  }

  public get targetEntityOptions(): {label: string; value: string}[] {
    return Object.values(URLQueryTargetEntity).map((value) => ({
      label: this.$t(value).toString(),
      value,
    }))
  }

  public get formatOptions(): {label: string; value: string}[] {
    return Object.values(URLQueryFormat).map((value) => ({
      label: value.toUpperCase(),
      value,
    }))
  }

  public get AVERAGING_PERIOD_OPTIONS(): URLQueryAveragingPeriod[] {
    return Object.values(URLQueryAveragingPeriod)
  }

  public get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }

  public async beforeMount() {
    this.isLoading = true
    await this.fetch()
    this.isLoading = false
  }

  public async fetch() {
    this.$loader.on()

    await this.setUrlQueryDefaults()

    if (!this.pageData.cities.length) {
      const cities = await this.fetchCities()
      this.pageData.cities = cities
    }

    this.pageData.measurements = []
    this.pageData.stations = []

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
        ? this.pageData.cities.filter((city) => idsMap[city.id])
        : []
      await this.setUrlQuery({
        ...this.urlQuery,
        cities: existingCities.map((i) => i.id),
      })
    } else if (this.pageData.cities[0]) {
      await this.setUrlQuery({
        ...this.urlQuery,
        cities: [this.pageData.cities[0].id],
      })
    }

    const promises: Promise<any>[] = []

    promises.push(
      this.fetchPollutants().then((items) => (this.pageData.pollutants = items))
    )

    if (this.urlQuery.entity === URLQueryTargetEntity.station) {
      promises.push(
        this.fetchStations({city: this.urlQuery.cities}).then(
          (items) => (this.pageData.stations = items)
        )
      )
    }

    const [err] = await to(Promise.all(promises))
    if (err) {
      this.$loader.off()
      this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }

    this.$loader.off()
  }

  public async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    // set from cache
    if (!urlQuery.cities.length && this.queryFormCached?.cities.length) {
      urlQuery.cities = this.queryFormCached.cities
    }
    if (!urlQuery.entity) {
      urlQuery.entity = URLQueryTargetEntity.measurement
    }
    if (!urlQuery.format) {
      urlQuery.format = URLQueryFormat.json
    }

    await this.setUrlQuery(urlQuery)

    if (this.formHasAggregation && !urlQuery.aggregation) {
      urlQuery.aggregation = URLQueryAggregation.city
    }
    if (this.formHasRunningAverage && !urlQuery.averaging_period) {
      urlQuery.averaging_period = URLQueryAveragingPeriod['1m']
    }
    if (this.formHasDates && !urlQuery.date_start) {
      urlQuery.date_start = toURLStringDate(JAN_1__THREE_YEARS_AGO)
    }
    if (this.formHasDates && !urlQuery.date_end) {
      urlQuery.date_end = toURLStringDate(today)
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

  public async fetchStations(query: {city: string[]}): Promise<Station[]> {
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

  // TODO: complete
  public async onChangeQuery(query: URLQuery) {
    // const citiesOld = [...this.urlQuery.cities].sort().join(',')
    // const citiesNew = [...query.cities].sort().join(',')
    // const citiesChanged = citiesOld !== citiesNew

    await this.setUrlQuery(query)

    // if (citiesChanged) this.onClickRefresh()
  }

  // TODO: complete
  public async onClickDownload() {
    this.$loader.on()
    this.$dialog.notify.info(this.$tc('msg.will_be_added_soon').toString())
    // await this.refreshChartData()
    this.$loader.off()
  }

  public toURLStringDate(d: number): string {
    return toURLStringDate(d)
  }
  public toNumberDate(d: string): number {
    return toNumberDate(d)
  }
}
</script>

<style lang="scss">
</style>
