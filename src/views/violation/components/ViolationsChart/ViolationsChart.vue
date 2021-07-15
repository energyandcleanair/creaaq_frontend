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

  <template v-else-if="!violations.length">
    <v-alert class="text-center ma-12" color="grey lighten-3">
      {{ $t('msg.no_data') }}
    </v-alert>
  </template>

  <template v-else>
    <v-row
      v-for="row of chartRows"
      :key="row.id"
      class="chart-row"
    >

      <v-list-item
        class="chart-row__title grey lighten-4 primary--text mb-6"
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
        <v-list-item class="chart-col__title">
          <v-list-item-content class="text-subtitle-2 font-weight-bold">
            <v-list-item-title v-text="col.title"/>
          </v-list-item-content>
        </v-list-item>

        <v-date-picker
          class="chart-col__date-picker"
          active-picker="DATE"
          :value="col.date"
          :events="col.events"
          :show-current="false"
          :show-adjacent-months="false"
          first-day-of-week="1"
          no-title
          readonly
          @click:date="onClickDate"
        />
      </v-col>
    </v-row>
  </template>

  <ChartTooltip
    ref="calendarTooltip"
    v-model="tooltip.visible"
    :activator="tooltip.activator"
    :title="tooltip.title"
    :subtitle="tooltip.subtitle"
    :table-headers="tooltip.tableHeaders"
    :table-items="tooltip.tableItems"
  />
</v-container>
</template>

<script lang="ts">
import chroma from 'chroma-js'
import tippy from 'tippy.js'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _orderBy from 'lodash.orderby'
import moment from 'moment'
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'
import { Plotly } from 'vue-plotly'
import { URL_DATE_FORMAT } from '@/utils'
import theme from '@/theme'
import Pollutant from '@/entities/Pollutant'
import City from '@/entities/City'
import Organization from '@/entities/Organization'
import Violation from '@/entities/Violation'
import Target from '@/entities/Target'
import URLQuery from '../../types/URLQuery'
import ChartTooltip from './ChartTooltip.vue'
import ChartData from './ChartData'
import ChartRow from './ChartRow'
import ChartCol from './ChartCol'

const COL_ID_DIVIDER = '--'

interface ViolationsCalendar {
  [year: string]: {
    [month: string]: {
      [date: string]: number // number of violations
    }
  }
}

interface MapFilter {
  [id: string]: number
}

interface TooltipParams {
  visible: boolean
  activator: any
  title: string
  subtitle: string
  tableHeaders: any[]
  tableItems: any[]
}

const TOOLTIP_DEFAULTS = {
  visible: false,
  activator: null,
  title: '',
  subtitle: '',
  tableHeaders: [],
  tableItems: [],
}

@Component({
  components: {
    Plotly,
    ChartTooltip,
  }
})
export default class ViolationsChart extends Vue {

  @Ref('calendarTooltip')
  readonly $calendarTooltip!: any

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  @Prop({type: Boolean, default: false})
  public readonly loading!: boolean

  private tooltip: TooltipParams = TOOLTIP_DEFAULTS
  private tooltips: any[] = []

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
    const b = this.$vuetify.breakpoint
    if (b.width >= 1620) return 2
    if (b.width >= 1300) return 3
    if (b.width >= 1100) return 4
    if (b.width >= 600) return 6
    return 12
  }

  private get filteredViolations (): Violation[] {
    const violations: Violation[] = []
    const filterCities: MapFilter = this.queryParams.cities
      .reduce((memo: MapFilter, id: City['id']) => (memo[id] = 1) && memo, {})

    let filterPollutants: MapFilter|null = this.queryParams.pollutants
      .reduce((memo: MapFilter, id: Pollutant['id']) => (memo[id] = 1) && memo, {})
    if (!Object.keys(filterPollutants).length) filterPollutants = null

    let filterOrganizations: MapFilter|null = this.queryParams.organizations
      .reduce((memo: MapFilter, id: Organization['id']) => (memo[id] = 1) && memo, {})
    if (!Object.keys(filterOrganizations).length) filterOrganizations = null

    let filterTargets: MapFilter|null = this.queryParams.targets
      .reduce((memo: MapFilter, id: Target['id']) => (memo[id] = 1) && memo, {})
    if (!Object.keys(filterTargets).length) filterTargets = null

    for (const violation of this.violations) {
      const cityId = violation.location_id

      if (!_valuePassesFilter(cityId, filterCities) ||
        !_valuePassesFilter(violation.pollutant, filterPollutants) ||
        !_valuePassesFilter(violation.organization, filterOrganizations) ||
        !_valuePassesFilter(violation.target_id, filterTargets)) {
        continue
      }

      violations.push(violation)
    }

    return violations
  }

  private get chartRows (): ChartRow[] {
    if (this.loading) return []
    if (!this.queryParams.cities?.length) return []

    // const filterCities: MapFilter = this.queryParams.cities
    //   .reduce((memo: MapFilter, id: City['id']) => (memo[id] = 1) && memo, {})

    // let filterPollutants: MapFilter|null = this.queryParams.pollutants
    //   .reduce((memo: MapFilter, id: Pollutant['id']) => (memo[id] = 1) && memo, {})
    // if (!Object.keys(filterPollutants).length) filterPollutants = null

    // let filterOrganizations: MapFilter|null = this.queryParams.organizations
    //   .reduce((memo: MapFilter, id: Organization['id']) => (memo[id] = 1) && memo, {})
    // if (!Object.keys(filterOrganizations).length) filterOrganizations = null

    // let filterTargets: MapFilter|null = this.queryParams.targets
    //   .reduce((memo: MapFilter, id: Target['id']) => (memo[id] = 1) && memo, {})
    // if (!Object.keys(filterTargets).length) filterTargets = null

    const citiesCalendars: {[cityId: string]: ViolationsCalendar} = {}

    // gen violations calendar for each city
    for (const violation of this.filteredViolations) {
      const cityId = violation.location_id

      // if (!_valuePassesFilter(cityId, filterCities) ||
      //   !_valuePassesFilter(violation.pollutant, filterPollutants) ||
      //   !_valuePassesFilter(violation.organization, filterOrganizations) ||
      //   !_valuePassesFilter(violation.target_id, filterTargets)) {
      //   continue
      // }

      if (!citiesCalendars[cityId]) citiesCalendars[cityId] = {}
      const violationsCalendar: ViolationsCalendar = citiesCalendars[cityId]

      const $date = moment(violation.date, URL_DATE_FORMAT)
      const calendarProp = $date.format(`YYYY.MM.DD`)
      const violations = _get(violationsCalendar, calendarProp) as any as number || 0
      _set(violationsCalendar, calendarProp, violations + 1)
    }

    const rows: ChartRow[] = []

    // gen chart rows with the calendars
    for (const cityId of this.queryParams.cities) {
      const city: City = this.cities.find(itm => itm.id === cityId) as City
      const row: ChartRow = {
        id: city.id,
        cityId: city.id,
        title: city.name,
        cols: [],
      }
      const violationsCalendar: ViolationsCalendar = citiesCalendars[city.id]

      for (const year in violationsCalendar) {
        for (let month = 0; month <= 11; month++) {
          const monthStr = month < 10 ? `0${month}` : String(month)

          const $firstDate = moment(0).year(+year).month(month).date(1)
          const col: ChartCol = {
            id: `${row.id}${COL_ID_DIVIDER}${year}${COL_ID_DIVIDER}${monthStr}`,
            title: $firstDate.format('MMMM YYYY'),
            date: $firstDate.format('YYYY-MM-DD'),
            events: {},
          }

          const y_m = $firstDate.format('YYYY-MM')
          for (let date = 1; date <= $firstDate.daysInMonth(); date++) {
            const dateStr = date < 10 ? `0${date}` : String(date)
            const key = `${y_m}-${dateStr}`
            const val = _get(violationsCalendar, key.replace(/-/g, '.'), 0) as any as number
            col.events[key] = _getViolationsColor(val)
          }

          row.cols.push(col)
        }
      }

      rows.push(row)
    }

    return rows
  }

  private mounted () {
    document.body.addEventListener('click', () => {
      this.closeAllTooltips()
    }, false)
  }

  private onClickDate (date: string, $event: MouseEvent) {
    $event.stopPropagation()
    const $target: HTMLElement|null = $event.target as HTMLElement|null
    const $btn: HTMLElement|undefined|null = $target?.closest('.v-btn')

    if (!$btn) return this.closeAllTooltips()
    const violations = this.filteredViolations.filter(itm => itm.date === date)
    let numRedViolations = 0

    const tableItems = violations.map(item => {
      const target = this.chartData.targets.find(i => i.id === item.target_id)
      const value = Math.round(item.value || 0)
      const target_value = Math.round(item.target_value || 0)
      const exceeded = value > target_value
      if (exceeded) numRedViolations++
      return {
        exceeded,
        class: exceeded ? 'red--text' : 'green--text',
        title: target?.short_name || item.organization || item.pollutant || '?',
        pollutant: item.pollutant || '?',
        value: value,
        target_value: target_value,
      }
    })

    const tooltipParams: TooltipParams = {
      visible: true,
      activator: $btn,
      title: (numRedViolations +
        ' ' +
        (numRedViolations <= 1 ? this.$t('violation') : this.$t('violations'))
      ).toLowerCase(),
      subtitle: moment(date, 'YYYY-MM-DD').format('D MMMM YYYY'),
      tableHeaders: [
        {
          text: '',
          value: 'title',
          align: 'start',
        },
        {
          text: this.$t('pollutant'),
          value: 'pollutant',
          align: 'center',
        },
        {
          text: this.$t('value'),
          value: 'value',
          align: 'center',
        },
        {
          text: this.$t('target'),
          value: 'target_value',
          align: 'center',
        },
      ],
      tableItems: _orderBy(tableItems, 'exceeded', 'desc'),
    }
    this.openDateTooltip($btn, tooltipParams, $event)
  }

  private openDateTooltip (
    $el: HTMLElement,
    tooltipParams: TooltipParams,
    $event: MouseEvent
  ) {
    this.tooltip = Object.assign(
      {
        ...TOOLTIP_DEFAULTS,
        visible: true,
      },
      tooltipParams
    )

    const inst = tippy($el, {
      trigger: 'click',
      showOnCreate: true,
      interactive: true,
      appendTo: this.$el,
      render: (ins: any) => ({
        popper: this.$calendarTooltip.$el,
      })
    })
    this.tooltips.push(inst)
  }

  private closeAllTooltips () {
    this.tooltips.forEach(inst => inst?.destroy())
    this.tooltips = []
  }
}

const VIOLATIONS_HIGHEST_AMOUNT = 10
const VIOLATIONS_PALETTE_SIZE = 7
const VIOLATIONS_SCALE = chroma.scale([
  theme.colors.orange.base,
  theme.colors.darkRed.base,
])
const PALETTE_COLORS = VIOLATIONS_SCALE.mode('lch').colors(VIOLATIONS_PALETTE_SIZE + 1)
function _getViolationsColor (num: number): string {
  if (num === 0) return theme.colors.lightGray.base
  const percentage = num / (VIOLATIONS_HIGHEST_AMOUNT / 100)
  const scaleVal = num >= VIOLATIONS_HIGHEST_AMOUNT
    ? 1
    : Math.min(1, percentage / 100)
  return PALETTE_COLORS[Math.round(VIOLATIONS_PALETTE_SIZE * scaleVal)]
}

function _valuePassesFilter (
  key: any,
  filterMap: MapFilter|null,
): boolean {
  return !filterMap || (key && filterMap[key])
}
</script>

<style lang="scss">

$violations-chart__picker--width: 170px;
$violations-chart__picker--min-height: 170px;

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
      z-index: 10;
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
      overflow: visible;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;

      &__title {
        min-height: auto;
        width: $violations-chart__picker--width;
        text-align: left;
        border-radius: 3px;
        padding: 0 $violations-chart__picker--width / 20;

        .v-list-item__content {
          padding: 0;
        }

        .v-list-item__title {
          font-size: 1.15em;
          line-height: 1.4em;
        }
      }

      &__date-picker {
        display: flex;

        .v-picker__body {
          width: $violations-chart__picker--width !important;
          overflow: visible;
        }

        .v-date-picker-header {
          display: none;
        }

        .v-date-picker-table {
          min-height: $violations-chart__picker--min-height;
          height: auto;
          padding: 0;

          > table {
            tr {
              font-size: 0.8rem;
            }

            .v-btn {
              position: relative;
              border-radius: 3px;
              width: 21px;
              height: 21px;
              margin: 0 !important;
              display: flex;

              // deactivate the active button
              &.v-btn--active {
                background: none !important;
                color: rgb(0 0 0 / 87%) !important;

                &:before {
                  opacity: 0;
                }

                &:hover {
                  &:before {
                    opacity: 0.08;
                  }
                }
              }

              &:hover {
                .v-date-picker-table__events {
                  opacity: 0.95;
                }
              }

              &:hover::before,
              &:focus::before {
                opacity: 0.08 !important;
              }

              &:focus,
              &:hover {
                &:before  {
                  background: var(--v-primary-lighten1);

                }
                .v-date-picker-table__events > div {
                  border-color: rgb(41, 41, 41) !important;
                  opacity: 0.8 !important;
                }
              }

              .v-btn__content {
                z-index: 5;
                font-size: 0.9em;
              }

              .v-date-picker-table__events {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                z-index: 1;
                border-radius: inherit;

                div {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  border-radius: inherit;
                  border: solid transparent 1px;
                }
              }
            }
          }
        }
      }
    }

    &--hidden {
      display: none;
    }
  }
}
</style>