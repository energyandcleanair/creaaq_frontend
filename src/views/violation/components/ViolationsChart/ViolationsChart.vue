<template>
<v-container
  class="violations-chart"
  fluid
>

  <template v-if="loading">
    <v-skeleton-loader class="mb-2" type="image" style="height: 64px;" />

    <v-row class="px-2">
      <template v-for="i of (12 / vCols)">
        <v-col :key="i">
          <v-skeleton-loader type="text, image" />
        </v-col>
      </template>
    </v-row>
  </template>

  <!-- <template v-else-if="!violations.length">
    <v-alert class="text-center ma-12" color="grey lighten-3">
      {{ $t('msg.no_data') }}
    </v-alert>
  </template> -->

  <template v-else>
    <v-row
      v-for="row of chartRows"
      :key="row.id"
      class="chart-row"
    >

      <v-list-item
        class="chart-row__title grey lighten-4 primary--text"
        two-line
      >
        <v-list-item-content>
          <v-list-item-title>
            <span class="font-weight-bold">{{ row.title }}</span>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-col
        v-for="col of row.cols"
        class="chart-col"
        :key="col.id"
        :cols="vCols"
      >
        <!-- [] -->

        <v-date-picker
          :value="dates"
          :show-current="false"
          readonly
        ></v-date-picker>
        <!-- <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="chart-col__title blue" v-bind="attrs" v-on="on">
              <v-list-item-content>
                <v-list-item-title v-text="col.title"/>
              </v-list-item-content>
            </v-list-item>
          </template>
          <span>{{ col.title }}</span>
        </v-tooltip> -->

        <!-- <Plotly
          class-name="ooops"
          :ref="`chart:${col.id}`"
          :id="`chart:${col.id}`"
          :data="col.data"
          :layout="col.layout"
          :config="{responsive: true}"
          :displaylogo="false"
          :display-mode-bar="col.isEmpty ? false : 'hover'"
          @relayout="onRelayout(row.id, col.id, $refs[`chart:${col.id}`][0], $event)"
        /> -->
      </v-col>
    </v-row>
  </template>
</v-container>
</template>

<script lang="ts">
import _get from 'lodash.get'
import _set from 'lodash.set'
import _sortBy from 'lodash.sortby'
import _groupBy from 'lodash.groupby'
import moment from 'moment'
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Plotly } from 'vue-plotly'
import Pollutant from '@/entities/Pollutant'
import City from '@/entities/City'
import Organization from '@/entities/Organization'
import Violation from '@/entities/Violation'
import Target from '@/entities/Target'
import URLQuery from '../../types/URLQuery'
import ChartData from './ChartData'
import ChartRow from './ChartRow'
import ChartCol from './ChartCol'
import { URL_DATE_FORMAT } from '@/helpers'

const COL_ID_DIVIDER = '--'

@Component({
  components: {
    Plotly,
  }
})
export default class ViolationsChart extends Vue {

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  @Prop({type: Boolean, default: false})
  public readonly loading!: boolean

  private get cities (): City[] {
    return this.chartData.cities || []
  }

  private get violations (): Violation[] {
    return this.chartData.violations || []
  }

  private get pollutants (): Pollutant[] {
    return this.chartData.pollutants || []
  }

  private get organizations (): Organization[] {
    return this.chartData.organizations || []
  }

  private get targets (): Target[] {
    return this.chartData.targets || []
  }

  private get vCols (): number /* Vuetify <v-col> size: [1, 12] */ {
    return 2
  }

  private get chartRows (): ChartRow[] {
    if (this.loading) return []
    if (!this.queryParams.cities?.length) return []

    const rows: ChartRow[] = []
    const citiesMap = this.queryParams.cities
      .reduce((memo: {[id: string]: number}, id: City['id']) => {
        memo[id] = 1
        return memo
      }, {})

    let pollutantsFilter: {[k: string]: number}|null = this.queryParams.pollutants
      .reduce((memo: {[id: string]: number}, id: Pollutant['id']) => {
        memo[id] = 1
        return memo
      }, {})
    if (!Object.keys(pollutantsFilter).length) pollutantsFilter = null

    let organizationsFilter: {[k: string]: number}|null = this.queryParams.organizations
      .reduce((memo: {[id: string]: number}, id: Organization['id']) => {
        memo[id] = 1
        return memo
      }, {})
    if (!Object.keys(organizationsFilter).length) organizationsFilter = null

    let targetsFilter: {[k: string]: number}|null = this.queryParams.targets
      .reduce((memo: {[id: string]: number}, id: Target['id']) => {
        memo[id] = 1
        return memo
      }, {})
    if (!Object.keys(targetsFilter).length) targetsFilter = null


    for (const city of this.cities) {
      if (!citiesMap[city.id]) continue

      const row: ChartRow = {
        id: city.id,
        cityId: city.id,
        title: city.name,
        cols: [],
      }

      // const months: {date: string, events: any[]}[] = Array(12)
      //   .fill(0)
      //   .map((_, i) => ({
      //     date: moment
      //   }))

      const violationsCalendar: {[date: string]: number} = {}

      for (const violation of this.violations) {
        if (violation.location_id !== city.id) continue

        // const pollutantId = violation.pollutant
        // const organizationId = violation.organization
        // const targetId = violation.target_id

        // const passFilter_pollutant = !pollutantsFilter ||
        //   (pollutantId && pollutantsFilter[pollutantId])

        // const passFilter_organization = !organizationsFilter ||
        //   (organizationId && organizationsFilter[organizationId])

        // const passFilter_target = !targetsFilter ||
        //   (targetId && targetsFilter[targetId])

        // if (!passFilter_pollutant || !passFilter_organization || !passFilter_target) {
        //   continue
        // }

        const $date = moment(violation.date, URL_DATE_FORMAT)
        // const month = $date.month()
        const dateString = $date.format(URL_DATE_FORMAT)

        if (!violationsCalendar[dateString]) violationsCalendar[dateString] = 0
        violationsCalendar[dateString]++
      }
      console.log('violationsCalendar: ', violationsCalendar)


      // let month = -1
      // while (++month <= 11) {
      //   console.log('month: ', month)

      //   const col: ChartCol = {
      //     id: `${row.id}${COL_ID_DIVIDER}${month}`,
      //     title: city.name,
      //     data,
      //     isEmpty,
      //     rangeBox: chartData.rangeBox,
      //   }

        // row.cols.push(col)
      // }

      rows.push(row)
    }

    return rows
  }
}
</script>

<style lang="scss">
.violations-chart {
  padding: 0 0.5rem 0 0;

  .chart-row {
    position: relative;
    margin: 0 0 1rem 0;

    &__title {
      width: 100%;
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 2;
      border-radius: 3px;
      min-height: auto;

      .v-list-item__subtitle {
        font-size: 0.7em;
      }

      .v-list-item__content {
        padding: 0.7rem 0;
      }
    }

    .chart-col {
      padding: 0.5rem 0.3rem;
      overflow: hidden;

      &__title {
        min-height: auto;
        text-align: center;
        border-radius: 3px;
        padding: 0 0.3rem;

        .v-list-item__content {
          padding: 0;
        }

        .v-list-item__title {
          font-size: 1em;
          line-height: 1.4em;
        }
      }
    }

    // &--cols-1,
    // &--cols-2 {
    //   .chart-col {
    //     .chart-col__title {
    //       .v-list-item__title {
    //         font-size: 0.8em;
    //       }
    //     }
    //   }
    // }

    &--hidden {
      display: none;
    }
  }

  // &--dense {
  //   display: flex !important;
  //   flex-wrap: wrap !important;
  //   flex: 1 1 auto !important;
  //   margin: -12px !important;

  //   .chart-row {
  //     flex-basis: 0 !important;
  //     flex-grow: 1 !important;
  //     padding: 0.5rem 0.3rem;

  //     .chart-col {
  //       flex: 0 0 100% !important;
  //       max-width: 100% !important;
  //       padding: 0;

  //       .chart-col__title {
  //         display: none;
  //       }
  //     }
  //   }
  // }
}
</style>