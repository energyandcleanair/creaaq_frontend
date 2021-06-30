<template>
<div class="view-stations fill-height" style="overflow: auto;">
  <v-container class="toolbar pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" sm="4" md="3">
        <SelectBoxCountries
          :value="usedCountiriesIds"
          :label="$t('countries')"
          :items="chartData.countries"
          @input="onChangeCountries($event)"
        />
      </v-col>

      <v-col cols="12" sm="8" md="6">
        <SelectBoxCities
          :value="urlQuery.cities"
          :label="$t('cities')"
          :items="selectedCountriesCities"
          :disabled="isLoading"
          @input="onChangeQuery({...urlQuery, cities: $event})"
        />
      </v-col>

      <v-col
        class="d-flex justify-end align-center"
        cols="12"
        sm="12"
        md="3"
      >
        <v-btn
          class="ml-2"
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
import { Component, Vue } from 'vue-property-decorator'
import { ModuleState } from '@/store'
import City from '@/entities/City'
import Country from '@/entities/Country'
import Station from '@/entities/Station'
import CityAPI from '@/api/CityAPI'
import StationAPI from '@/api/StationAPI'
import SelectBoxCountries from '@/components/SelectBoxCountries.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import { toQueryString } from '@/utils'
import StationsChart from './components/StationsChart/StationsChart.vue'
import ChartData from './components/StationsChart/ChartData'
import URLQuery from './types/URLQuery'

@Component({
  components: {
    SelectBoxCountries,
    SelectBoxCities,
    StationsChart,
  }
})
export default class ViewStations extends Vue {
  private isLoading: boolean = false
  private isChartLoading: boolean = false

  private chartData: ChartData = {
    countries: [],
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

  private get usedCountiriesMap (): {[countryId: string]: 1} {
    const map: {[id: string]: 1} = {}

    for (const cityId of this.urlQuery.cities) {
      const city = this.chartData.cities.find(itm => itm.id === cityId)
      const countryId = city?.country_id
      if (!countryId) continue
      map[countryId] = 1
    }

    return map
  }

  private get usedCountiriesIds (): Country['id'][] {
    return Object.keys(this.usedCountiriesMap)
  }

  private get selectedCountriesCities (): City[] {
    const cities: City[] = []
    for (const countryId in this.usedCountiriesMap) {
      const country = this.chartData.countries.find(itm => itm.id === countryId)
      if (!country) continue
      cities.push(...country._cities || [])
    }
    return _orderBy(cities, 'name')
  }

  private get selectedCities (): City[] {
    if (!this.urlQuery.cities?.length) return []
    return this.chartData.cities
      .filter(itm => this.urlQuery.cities.includes(itm.id))
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

    const cities = await this.fetchCities()
    this.chartData.cities = cities

    const countries: Country[] = Object.values(cities.reduce(
      (memo: {[countryId: string]: Country}, city: City) => {
        let country = memo[city.country_id]

        if (!country) {
          country = memo[city.country_id] = {
            id: city.country_id,
            name: city.country_name,
            _cities: [],
          }
        }

        country._cities?.push(city)
        return memo
      },
      {}
    ))
    this.chartData.countries = _orderBy(countries, 'name')

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
    } else if (this.chartData.countries[0]) {
      this.onChangeCountries([
        this.chartData.countries[0].id
      ])
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
      countries: this.chartData.countries,
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
    const _query: {
      city?: string[]
      country?: string[]
    } = {...query}

    // if request is too large we will go with the countries IDs
    // instead of the Cities IDs
    const isRequestCountries = (_query.city?.join('%2C')?.length || 0) > 3800

    if (isRequestCountries) {
      _query.country = this.usedCountiriesIds
      delete _query.city
    }

    let [err, items = []] = await to(StationAPI.findAll(toQueryString(_query)))
    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }

    if (isRequestCountries) {
      items = items.filter(item => this.usedCountiriesMap[item.country_id])
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

  private async onChangeCountries (countriesIds: Country['id'][]) {
    const newIds = _difference(countriesIds, this.usedCountiriesIds)
    const removedIds = _difference(this.usedCountiriesIds, countriesIds)

    const citiesIds: {[id: string]: 1} = this.selectedCities
      .reduce((memo: any, city) => (memo[city.id] = 1) && memo, {})

    // delete cities
    for (const countryId of removedIds) {
      for (const city of this.selectedCities) {
        if (city.country_id === countryId) delete citiesIds[city.id]
      }
    }

    // add all cities from new countries
    for (const countryId of newIds) {
      const country = this.chartData.countries.find(itm => itm.id === countryId)
      if (!country) continue
      country._cities?.forEach(city => citiesIds[city.id] = 1)
    }

    this.onChangeQuery({
      ...this.urlQuery,
      cities: Object.keys(citiesIds)
    })
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