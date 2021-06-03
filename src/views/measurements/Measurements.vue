<template>
<div class="view-measurements fill-height" style="overflow: auto;">
  <v-container class="px-8" fluid>
    <v-row>
      <v-col cols="12" md="3" lg="2" xl="2">
        <SelectBox
          v-model="queryForm.countries"
          :label="$t('countries')"
          :items="countries"
          :disabled="isLoading"
          item-text="name"
          item-value="id"
          return-object
          hide-details
          @input="onChangeCountries"
        />
      </v-col>

      <v-col cols="12" md="3" lg="3" xl="2">
        <SelectBox
          v-model="queryForm.cities"
          :label="$t('cities')"
          :items="availableCities"
          :disabled="isLoading || !queryForm.countries.length"
          :item-text="(item) => `${item.name} (${item.country_id})`"
          item-value="id"
          return-object
          hide-details
          @input="onChangeForm"
        />
      </v-col>

      <v-col cols="12" md="3" lg="2" xl="2">
        <SelectBox
          v-model="queryForm.sources"
          :label="$t('sources')"
          :items="sources"
          :disabled="isLoading"
          item-text="label"
          item-value="value"
          return-object
          hide-details
          @input="onChangeForm"
        />
      </v-col>

      <v-col cols="12" md="3" lg="2" xl="2">
        <v-menu
          v-model="isMenuDateStartOpen"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
          offset-y
          left
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              :value="dateStartFormat"
              :label="$t('from')"
              :prepend-icon="mdiCalendar"
              :disabled="isLoading"
              readonly
              hide-details
              v-bind="attrs"
              v-on="on"
            />
          </template>

          <v-date-picker
            :value="dateStartFormat"
            @input="($e) => {
              queryForm.dateStart = +new Date($e);
              isMenuDateStartOpen = false;
              onChangeForm()
            }"
          />
        </v-menu>
      </v-col>

      <v-col cols="12" md="3" lg="2" xl="2">
        <v-menu
          v-model="isMenuDateEndOpen"
          :close-on-content-click="false"
          transition="scale-transition"
          min-width="auto"
          offset-y
          left
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              :value="dateEndFormat"
              :label="$t('to')"
              :prepend-icon="mdiCalendar"
              :disabled="isLoading"
              readonly
              hide-details
              v-bind="attrs"
              v-on="on"
            />
          </template>

          <v-date-picker
            :value="dateEndFormat"
            @input="($e) => {
              queryForm.dateEnd = +new Date($e);
              isMenuDateEndOpen = false;
              onChangeForm()
            }"
          />
        </v-menu>
      </v-col>

      <v-col cols="12" md="3" lg="2" xl="2">
        <v-select
          v-model="queryForm.displayMode"
          :label="$t('display_mode')"
          :items="DISPLAY_MODES"
          :disabled="isLoading"
          item-text="label"
          item-value="value"
          hide-details
          @input="onChangeForm"
        >
          <template v-slot:append-outer>
            <v-btn @click="onClickRefresh" icon>
              <v-icon>{{ mdiRefreshCircle }}</v-icon>
            </v-btn>
          </template>
        </v-select>
      </v-col>
    </v-row>
  </v-container>

  <v-container class="mt-4 px-8" fluid>
    <MeasurementsChart
      ref="measurementsChart"
      v-if="!isLoading"
      :query="queryForm"
      :displayMode="queryForm.displayMode"
    />
  </v-container>
</div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _sortBy from 'lodash.sortby'
import { Component, Vue, Ref } from 'vue-property-decorator'
import { mdiCalendar, mdiRefreshCircle } from '@mdi/js'
import Country from '@/entities/Country'
import City from '@/entities/City'
import Source from '@/entities/Source'
import CityAPI from '@/api/CityAPI'
import SelectBox from './components/SelectBox.vue'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import MeasurementsQuery from './components/MeasurementsChart/MeasurementsQuery'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'

interface URLQuery {
  cities: City['id'][]
  countries: Country['id'][]
  sources: Source['id'][]
  date_start: number
  date_end?: number
  display_mode?: string
}

const today = moment(moment().format('YYYY-MM-DD')).valueOf()

@Component({
  components: {
    SelectBox,
    MeasurementsChart,
  }
})
export default class ViewMeasurements extends Vue {
  @Ref('measurementsChart') $measurementsChart?: MeasurementsChart
  private countries: Country[] = []
  private cities: City[] = []
  private sources: Source[] = []
  private mdiCalendar = mdiCalendar
  private mdiRefreshCircle = mdiRefreshCircle
  private isLoading: boolean = false
  private isMenuDateStartOpen: boolean = false
  private isMenuDateEndOpen: boolean = false

  private queryForm: MeasurementsQuery = {
    cities: [],
    countries: [],
    sources: [],
    dateStart: today,
    dateEnd: today,
    displayMode: ChartDisplayModes.NORMAL,
  }

  private get DISPLAY_MODES (): any {
    return Object.values(ChartDisplayModes)
      .reduce((memo: any[], val) => {
        memo.push({
          label: val.toLowerCase(),
          value: val,
        })
        return memo
      }, [])
  }

  private get urlQuery (): URLQuery {
    const q = this.$route.query

    const cities = Array.isArray(q.cities) ? q.cities : [q.cities]
    const countries = Array.isArray(q.countries) ? q.countries : [q.countries]
    const sources = Array.isArray(q.sources) ? q.sources : [q.sources]

    return {
      cities: cities.filter(i => i) as City['id'][],
      countries: countries.filter(i => i) as Country['id'][],
      sources: sources.filter(i => i) as Source['id'][],
      date_start: q.date_start ? Number(q.date_start) : 0,
      date_end: q.date_end ? Number(q.date_end) : 0,
      display_mode: q.display_mode
        ? (String(q.display_mode) || '').toUpperCase()
        : undefined,
    }
  }

  private set urlQuery (queryForm: URLQuery) {
    const newRoutePath = this.$router.resolve({
      ...(this.$route as any),
      query: queryForm
    }).href

    if (this.$route.fullPath === newRoutePath) return

    this.$router.replace({
      ...(this.$route as any),
      query: queryForm
    })
  }

  private get dateStartFormat (): string {
    return moment(this.queryForm.dateStart).format('YYYY-MM-DD')
  }

  private get dateEndFormat (): string {
    return moment(this.queryForm.dateEnd).format('YYYY-MM-DD')
  }

  private get selectedCountriesMap (): {[countryId: string]: number} {
    return this.queryForm.countries
      .reduce((memo: {[countryId: string]: number}, country: Country) => {
        memo[country.id] = 1
        return memo
      }, {})
  }

  private get availableCities (): City[] {
    const cities = this.cities
      .filter(city => this.selectedCountriesMap[city.country_id])
    return _sortBy(
      _sortBy(cities, 'name'),
      'country_id'
    )
  }

  private async beforeMount () {
    this.isLoading = true
    await this.fetch()
    this.setDefaults()
    this.isLoading = false
  }

  private async fetch () {
    this.$loader.on()
    const cities = await this.fetchCities()

    const countriesMap = cities
      .reduce((memo: {[countryId: string]: Country}, city: City) => {
        if (!memo[city.country_id]) {
          memo[city.country_id] = {
            id: city.country_id,
            name: city.country_id,
          }
        }
        return memo
      }, {})
    const countries = _sortBy(Object.values(countriesMap), 'name')

    this.cities = cities
    this.countries = countries
    this.sources = []

    this.$loader.off()
  }

  private setDefaults (): void {
    if (this.urlQuery.countries.length) {
      const idsMap = this.urlQuery.countries
        .reduce((memo: {[id: string]: number}, id: Country['id']) => {
          memo[id] = 1
          return memo
        }, {})
      this.queryForm.countries = this.countries
        .filter(country => idsMap[country.id])
    } else if (this.countries[0]) {
      this.queryForm.countries = [this.countries[0]]
    }

    if (this.urlQuery.cities.length) {
      const idsMap = this.urlQuery.cities
        .reduce((memo: {[id: string]: number}, id: City['id']) => {
          memo[id] = 1
          return memo
        }, {})
      this.queryForm.cities = this.availableCities
        .filter(city => idsMap[city.id])
    } else if (this.availableCities[0]) {
      this.queryForm.cities = [this.availableCities[0]]
    }

    if (this.urlQuery.sources.length) {
      const idsMap = this.urlQuery.sources
        .reduce((memo: {[value: string]: number}, value: Source['id']) => {
          memo[value] = 1
          return memo
        }, {})
      this.queryForm.sources = this.sources
        .filter(source => idsMap[source.id])
    } else if (this.sources[0]) {
      this.queryForm.sources = [this.sources[0]]
    }

    if ((this.urlQuery.date_start || 0) > 0) {
      this.queryForm.dateStart = this.urlQuery.date_start
    } else if (!this.queryForm.dateStart) {
      this.queryForm.dateStart = today
    }

    if ((this.urlQuery.date_end || 0) > 0) {
      this.queryForm.dateEnd = this.urlQuery.date_end
    } else if (!this.queryForm.dateEnd) {
      this.queryForm.dateEnd = today
    }

    if (this.urlQuery.display_mode) {
      this.queryForm.displayMode = this.urlQuery.display_mode as ChartDisplayModes
    } else if (!this.queryForm.displayMode) {
      this.queryForm.displayMode = ChartDisplayModes.NORMAL
    }

    this.onChangeForm()
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
    return cities || []
  }

  private onChangeCountries () {
    this.queryForm.cities = this.queryForm.cities
      .filter(city => this.selectedCountriesMap[city.country_id])
    this.onChangeForm()
  }

  private onChangeForm () {
    this.urlQuery = {
      cities: this.queryForm.cities.map(i => i.id),
      countries: this.queryForm.countries.map(i => i.id),
      sources: this.queryForm.sources.map(i => i.id),
      date_start: this.queryForm.dateStart,
      date_end: this.queryForm.dateEnd,
      display_mode: this.queryForm.displayMode
    }
  }

  private onClickRefresh () {
    this.$measurementsChart?.refresh()
  }
}
</script>
