<template>
<div class="view-measurements fill-height" style="overflow: auto;">
  <v-container class="pt-10 pt-md-4 px-8" fluid>
    <v-row>
      <v-col cols="12" md="3" lg="3" xl="2">
        <SelectBox
          v-model="queryForm.cities"
          :label="$t('cities')"
          :items="cities"
          :disabled="isLoading"
          item-text="name"
          item-value="id"
          return-object
          hide-details
          has-deselect-all
          @input="onChangeForm"
        >
          <template v-slot:item-subtext="{item}">
            <CountryFlag
              :country="(item.country_id || '').toLowerCase()"
              size="small"
            />
            <span class="grey--text text--base">
              &nbsp;&nbsp;{{ item.country_id }}
            </span>
          </template>
        </SelectBox>
      </v-col>

      <!-- <v-col cols="12" md="3" lg="2" xl="2">
        <SelectBox
          v-model="queryForm.sources"
          :label="$t('sources')"
          :items="sources"
          :disabled="true"
          item-text="label"
          item-value="value"
          return-object
          hide-details
          @input="onChangeForm"
        />
      </v-col> -->

      <v-col cols="12" sm="6" md="3" lg="2" xl="2">
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

      <v-col cols="12" sm="6" md="3" lg="2" xl="2">
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

      <!-- <v-col cols="12" md="3" lg="2" xl="2">
        <v-select
          v-model="queryForm.displayMode"
          :label="$t('display_mode')"
          :items="DISPLAY_MODES"
          :disabled="isLoading"
          item-text="label"
          item-value="value"
          hide-details
          @input="onChangeForm"
        />
      </v-col> -->

      <v-col
        class="d-flex justify-end justify-md-start align-center"
        cols="12"
        md="2"
      >
        <v-btn
          class="ml-5"
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

  <v-container class="mt-4 px-8" fluid>
    <MeasurementsRightDrawer
      :open.sync="isRightPanelOpen"
    />

    <MeasurementsChart
      ref="measurementsChart"
      v-if="!isLoading"
      :query="queryForm"
      :displayMode="queryForm.displayMode"
      @loading="onChangeChartLoading"
    />
  </v-container>
</div>
</template>

<script lang="ts">
import to from 'await-to-js'
import moment from 'moment'
import _sortBy from 'lodash.sortby'
import CountryFlag from 'vue-country-flag'
import { Component, Vue, Ref } from 'vue-property-decorator'
import { mdiCalendar } from '@mdi/js'
import City from '@/entities/City'
// import Source from '@/entities/Source'
import CityAPI from '@/api/CityAPI'
import SelectBox from './components/SelectBox.vue'
import MeasurementsChart from './components/MeasurementsChart/MeasurementsChart.vue'
import MeasurementsQuery from './components/MeasurementsChart/MeasurementsQuery'
import ChartDisplayModes from './components/MeasurementsChart/ChartDisplayModes'
import MeasurementsRightDrawer from './components/MeasurementsRightDrawer.vue'

interface URLQuery {
  cities: City['id'][]
  // sources: Source['id'][]
  date_start: number
  date_end?: number
  display_mode?: string
}

const today = moment(moment().format('YYYY-MM-DD')).valueOf()

@Component({
  components: {
    MeasurementsRightDrawer,
    SelectBox,
    MeasurementsChart,
    CountryFlag,
  }
})
export default class ViewMeasurements extends Vue {
  @Ref('measurementsChart') $measurementsChart?: MeasurementsChart
  private cities: City[] = []
  // private sources: Source[] = []
  private mdiCalendar = mdiCalendar
  private isLoading: boolean = false
  private isChartLoading: boolean = false
  private isMenuDateStartOpen: boolean = false
  private isMenuDateEndOpen: boolean = false

  private queryForm: MeasurementsQuery = {
    cities: [],
    // sources: [],
    dateStart: today,
    dateEnd: today,
    displayMode: ChartDisplayModes.NORMAL,
  }

  private get DISPLAY_MODES (): any {
    return Object.values(ChartDisplayModes)
      .reduce((memo: any[], val) => {
        memo.push({
          label: this.$t(val.toLowerCase() || '').toString(),
          value: val,
        })
        return memo
      }, [])
  }

  private get urlQuery (): URLQuery {
    const q = this.$route.query

    const cities = Array.isArray(q.cities) ? q.cities : [q.cities]
    const sources = Array.isArray(q.sources) ? q.sources : [q.sources]

    return {
      cities: cities.filter(i => i) as City['id'][],
      // sources: sources.filter(i => i) as Source['id'][],
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

  private get isRightPanelOpen (): boolean {
    return this.$store.getters.GET('ui.measurements.isRightPanelOpen')
  }
  private set isRightPanelOpen (value: boolean) {
    console.log('isRightPanelOpen: ', value)
    this.$store.commit('SET', {key: 'ui.measurements.isRightPanelOpen', value})
  }

  private get dateStartFormat (): string {
    return moment(this.queryForm.dateStart).format('YYYY-MM-DD')
  }

  private get dateEndFormat (): string {
    return moment(this.queryForm.dateEnd).format('YYYY-MM-DD')
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

    this.cities = cities
    // this.sources = []

    this.$loader.off()
  }

  private setDefaults (): void {
    if (this.urlQuery.cities.length) {
      const idsMap = this.urlQuery.cities
        .reduce((memo: {[id: string]: number}, id: City['id']) => {
          memo[id] = 1
          return memo
        }, {})
      this.queryForm.cities = this.cities
        .filter(city => idsMap[city.id])
    } else if (this.cities[0]) {
      this.queryForm.cities = [this.cities[0]]
    }

    // if (this.urlQuery.sources.length) {
    //   const idsMap = this.urlQuery.sources
    //     .reduce((memo: {[value: string]: number}, value: Source['id']) => {
    //       memo[value] = 1
    //       return memo
    //     }, {})
    //   this.queryForm.sources = this.sources
    //     .filter(source => idsMap[source.id])
    // } else if (this.sources[0]) {
    //   this.queryForm.sources = [this.sources[0]]
    // }

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
    return _sortBy(cities || [], 'name')
  }

  private onChangeForm () {
    this.urlQuery = {
      cities: this.queryForm.cities.map(i => i.id),
      // sources: this.queryForm.sources.map(i => i.id),
      date_start: this.queryForm.dateStart,
      date_end: this.queryForm.dateEnd,
      display_mode: this.queryForm.displayMode
    }
  }

  private onClickRefresh () {
    this.$measurementsChart?.refresh()
  }

  private onChangeChartLoading (value: boolean) {
    this.isChartLoading = value
  }
}
</script>
