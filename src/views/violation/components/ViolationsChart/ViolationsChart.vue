<template>
  <v-container class="violations-chart" fluid>
    <template v-if="outdatedState">
      <v-row class="fill-width banner-outdated" no-gutters>
        <v-col class="d-flex justify-center">
          <v-btn
            color="primary"
            :loading="loading"
            outlined
            @click="$emit('click:refresh')"
          >
            <v-icon left>{{ mdiRefresh }}</v-icon>
            {{ $t('refresh') }}
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <template v-if="loading || outdatedState">
      <v-skeleton-loader
        class="mb-2"
        type="image"
        style="height: 64px"
        :boilerplate="outdatedState"
      />

      <v-row class="px-2">
        <v-col v-for="i of 12 / vCols" :key="i">
          <v-skeleton-loader type="text, image" :boilerplate="outdatedState" />
        </v-col>
      </v-row>
    </template>

    <template v-else-if="!violations.length">
      <v-alert class="text-center ma-12" color="grey lighten-3">
        {{ $t('msg.no_data') }}
      </v-alert>
    </template>

    <template v-else>
      <v-row v-for="row of chartRows" :key="row.id" class="chart-row">
        <v-list-item
          class="chart-row__title grey lighten-4 primary--text mb-6"
          two-line
        >
          <v-list-item-content>
            <v-list-item-title>
              <span class="text-title font-weight-bold">{{ row.title }}</span>
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
              <v-list-item-title v-text="col.title" />
            </v-list-item-content>
          </v-list-item>

          <v-calendar
            class="chart-col__calendar"
            type="month"
            :value="col.firstDate"
            :weekdays="[1, 2, 3, 4, 5, 6, 0]"
            :weekday-format="weekdayFormatter"
            :show-month-on-first="false"
          >
            <template v-slot:day-label>
              <span>
                <!-- empty -->
              </span>
            </template>

            <template v-slot:day="{day, outside, future}">
              <template v-if="outside">
                <!-- empty -->
              </template>

              <v-btn
                v-else-if="
                  future
                    ? col.dates[day] && !col.dates[day].tooltip.hasOvershoot
                    : !col.dates[day]
                "
                class="not-interactive"
                :color="'white'"
                :ripple="false"
                small
                depressed
              >
                {{ day }}
              </v-btn>

              <v-menu
                v-else
                contentClass="violations-chart__calendar__day-menu"
                top
                offset-y
                open-on-hover
                allow-overflow
                internal-activator
                z-index="110"
              >
                <template v-slot:activator="{on, attrs}">
                  <v-btn
                    v-if="!outside"
                    v-bind="attrs"
                    v-on="on"
                    :class="col.dates[day].class"
                    :color="col.dates[day].color || 'white'"
                    :ripple="false"
                    small
                    depressed
                  >
                    {{ day }}
                  </v-btn>
                </template>

                <ChartTooltip
                  v-if="col.dates[day].tooltip"
                  :title="col.dates[day].tooltip.title"
                  :subtitle="col.dates[day].tooltip.subtitle"
                  :table-headers="col.dates[day].tooltip.tableHeaders"
                  :table-items="col.dates[day].tooltip.tableItems"
                  :has-overshoot="col.dates[day].tooltip.hasOvershoot"
                  :has-overshoot-estimated="
                    col.dates[day].tooltip.hasOvershootEstimated
                  "
                />
              </v-menu>
            </template>
          </v-calendar>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
import chroma from 'chroma-js'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _orderBy from 'lodash.orderby'
import {mdiRefresh} from '@mdi/js'
import moment, {Moment} from 'moment'
import {Component, Vue, Prop, Ref} from 'vue-property-decorator'
import {Plotly} from 'vue-plotly'
import {URL_DATE_FORMAT} from '@/utils'
import theme from '@/theme'
import Pollutant from '@/entities/Pollutant'
import City from '@/entities/City'
import Regulation from '@/entities/Regulation'
import Violation from '@/entities/Violation'
import Target from '@/entities/Target'
import URLQuery from '../../types/URLQuery'
import ChartTooltip from './ChartTooltip.vue'
import TooltipParams from './TooltipParams'
import ChartData from './ChartData'
import ChartRow from './ChartRow'
import ChartCol from './ChartCol'
import Source from '@/entities/Source'

const COL_ID_DIVIDER = '--'
export const OVERSHOOT_VIOLATION_COLOR_CLASS = 'purple--text text--lighten-1'
export const OVERSHOOT_VIOLATION_COLOR = theme.colors.purple.lighten1

interface ViolationsCalendar {
  [year: string]: {
    [month: string]: {
      [date: string]: Violation[] | undefined
    }
  }
}

interface MapFilter {
  [id: string]: number
}

const TOOLTIP_DEFAULTS: TooltipParams = {
  title: '',
  subtitle: '',
  tableHeaders: [],
  tableItems: [],
  numExceedViolations: 0,
  hasOvershoot: false,
  hasOvershootEstimated: false,
}

@Component({
  components: {
    Plotly,
    ChartTooltip,
  },
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

  @Prop({type: Boolean, default: false})
  public readonly frozen!: boolean

  @Prop({type: Boolean, default: false})
  public readonly outdatedState!: boolean

  public readonly mdiRefresh = mdiRefresh
  public tooltip: TooltipParams = TOOLTIP_DEFAULTS
  public tooltips: any[] = []

  public get cities(): City[] {
    return this.chartData.cities || []
  }

  public get violations(): Violation[] {
    return this.chartData.violations || []
  }

  public get pollutants(): Pollutant[] {
    return this.chartData.pollutants || []
  }

  public get regulations(): Regulation[] {
    return this.chartData.regulations || []
  }

  public get targets(): Target[] {
    return this.chartData.targets || []
  }

  public get vCols(): number /* Vuetify <v-col> size: [1, 12] */ {
    const b = this.$vuetify.breakpoint
    if (b.width >= 1620) return 2
    if (b.width >= 1300) return 3
    if (b.width >= 1100) return 4
    if (b.width >= 600) return 6
    return 12
  }

  public get filteredViolations(): Violation[] {
    const violations: Violation[] = []
    const filterCities: MapFilter = this.queryParams.cities.reduce(
      (memo: MapFilter, id: City['id']) => (memo[id] = 1) && memo,
      {}
    )

    let filterPollutants: MapFilter | null = this.queryParams.pollutants.reduce(
      (memo: MapFilter, id: Pollutant['id']) => (memo[id] = 1) && memo,
      {}
    )
    if (!Object.keys(filterPollutants).length) filterPollutants = null

    let filterSources: MapFilter | null = this.queryParams.sources.reduce(
      (memo: MapFilter, id: Source['id']) => (memo[id] = 1) && memo,
      {}
    )
    if (!Object.keys(filterSources).length) filterSources = null

    let filterTargets: MapFilter | null = this.queryParams.targets.reduce(
      (memo: MapFilter, id: Target['id']) => (memo[id] = 1) && memo,
      {}
    )
    if (!Object.keys(filterTargets).length) filterTargets = null

    if (!filterTargets) return []

    for (const violation of this.violations) {
      const cityId = violation.location_id

      if (
        !_valuePassesFilter(cityId, filterCities) ||
        !_valuePassesFilter(violation.pollutant, filterPollutants) ||
        !_valuePassesFilter(violation.target_id, filterTargets) ||
        !_valuePassesFilter(violation.source, filterSources)
      ) {
        continue
      }

      violations.push(violation)
    }

    return violations
  }

  public get chartRows(): ChartRow[] {
    if (this.loading) return []
    if (!this.queryParams.cities?.length) return []

    const citiesCalendars: {[cityId: string]: ViolationsCalendar} = {}
    const queriedYear: number = moment(
      this.queryParams.date_start || new Date(),
      URL_DATE_FORMAT
    ).year()
    const _tomorrow: number = moment()
      .set({hour: 0, minute: 0, second: 0, millisecond: 0})
      .add(1, 'day')
      .valueOf()

    // gen violations calendar for each city
    for (const violation of this.filteredViolations) {
      const cityId = violation.location_id

      if (!citiesCalendars[cityId]) citiesCalendars[cityId] = {}
      const violationsCalendar: ViolationsCalendar = citiesCalendars[cityId]

      const $date = moment(violation.date, URL_DATE_FORMAT)
      const calendarProp = $date.format('YYYY.MM.DD')

      let violations: Violation[] | undefined = _get(
        violationsCalendar,
        calendarProp
      ) as any as Violation[] | undefined

      if (!violations) {
        _set<Violation[]>(violationsCalendar, calendarProp, [])
        violations = _get(
          violationsCalendar,
          calendarProp
        ) as any as Violation[]
      }
      violations.push(violation)
    }

    const rows: ChartRow[] = []

    // gen chart rows with the calendars
    for (const cityId of this.queryParams.cities) {
      const city: City = this.cities.find((itm) => itm.id === cityId) as City
      const row: ChartRow = {
        id: city.id,
        cityId: city.id,
        title: city.name,
        cols: [],
      }
      let violationsCalendar: ViolationsCalendar | undefined =
        citiesCalendars[city.id]

      // draw empty calendar
      if (!violationsCalendar) violationsCalendar = {[queriedYear]: {}}

      for (const year in violationsCalendar) {
        for (let month = 0; month <= 11; month++) {
          const monthStr = month < 10 ? `0${month}` : String(month)

          const $firstDate = moment(0)
            .year(+year)
            .month(month)
            .date(1)
          const col: ChartCol = {
            id: `${row.id}${COL_ID_DIVIDER}${year}${COL_ID_DIVIDER}${monthStr}`,
            title: $firstDate.format('MMMM YYYY'),
            firstDate: $firstDate.format('YYYY-MM-DD'),
            dates: {},
          }

          const y_m = $firstDate.format('YYYY-MM')
          for (let date = 1; date <= $firstDate.daysInMonth(); date++) {
            const dateStr = date < 10 ? `0${date}` : String(date)
            const key = `${y_m}-${dateStr}`
            const $date = moment(key, 'YYYY-MM-DD')
            const dateViolations: Violation[] | undefined = _get(
              violationsCalendar,
              key.replace(/-/g, '.')
            ) as any as Violation[] | undefined

            const tooltipParams = this.genDateTooltipParams(
              $date,
              dateViolations || [],
              this.chartData.targets || [],
              this.chartData.regulations || [],
              {isMarkOvershoot: !!this.queryParams.overshooting}
            )

            let violationsNum: number | undefined
            let overshootEstimatedViolation: Violation | undefined
            let overshootViolation: Violation | undefined

            if (dateViolations?.length) {
              if (+$date >= _tomorrow) {
                violationsNum = -1
              } else {
                violationsNum = tooltipParams.numExceedViolations || 0
              }

              if (this.queryParams.overshooting === true) {
                overshootEstimatedViolation = dateViolations?.find(
                  (v) => v.is_overshoot_estimated
                )
                if (!overshootEstimatedViolation) {
                  overshootViolation = dateViolations?.find(
                    (v) => v.is_overshoot
                  )
                }
              }
            }

            col.dates[date] = {
              class: overshootEstimatedViolation ? 'v-btn--striped' : '',
              color:
                overshootViolation || overshootEstimatedViolation
                  ? OVERSHOOT_VIOLATION_COLOR
                  : _getViolationsColor(violationsNum),
              violations: dateViolations || [],
              tooltip: tooltipParams,
            }
          }

          row.cols.push(col)
        }
      }

      rows.push(row)
    }

    return rows
  }

  public weekdayFormatter(dayProps: any) {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayProps.weekday]
  }

  public genDateTooltipParams(
    $date: Moment,
    violations: Violation[],
    targets: Target[],
    regulations: Regulation[],
    opts?: {
      isMarkOvershoot: boolean
    }
  ): TooltipParams {
    let numExceedViolations = 0
    let hasOvershoot = false
    let hasOvershootEstimated = false

    const tableItems: TooltipParams['tableItems'] = violations.map((item) => {
      const target = targets.find((i) => i.id === item.target_id)
      const regulation = regulations.find((i) => i.id === target?.regulation_id)
      const value = Math.round(item.value || 0)
      const target_value = Math.round(item.target_value || 0)
      const isOvershoot: boolean =
        !!opts?.isMarkOvershoot &&
        !!(item.is_overshoot_estimated || item.is_overshoot)
      const isOvershootEstimated: boolean =
        !!opts?.isMarkOvershoot && !!item.is_overshoot_estimated
      const exceeded = value > target_value
      if (exceeded) numExceedViolations++
      if (isOvershoot && !hasOvershoot) hasOvershoot = true
      if (isOvershootEstimated && !hasOvershootEstimated)
        hasOvershootEstimated = true

      return {
        exceeded,
        class: isOvershoot
          ? OVERSHOOT_VIOLATION_COLOR_CLASS
          : exceeded
          ? 'red--text'
          : 'green--text',
        title: target?.name || item.pollutant || '?',
        pollutant_name:
          target?.pollutant_name || (item.pollutant || '?').toUpperCase(),
        source: item._source
          ? item._source.short_name || item._source.name
          : '',
        value: isOvershoot ? `${value}*` : value,
        target_value: target_value,
        target_unit: target?.target_unit,
        averaging_period_name: target?.averaging_period_name,
        regulation_name: regulation?.name,
      }
    })

    const tooltipParams: TooltipParams = {
      title: (
        numExceedViolations +
        ' ' +
        (numExceedViolations <= 1
          ? this.$t('violation')
          : this.$t('violations'))
      ).toLowerCase(),
      subtitle: $date.format('D MMMM YYYY'),
      numExceedViolations,
      hasOvershoot,
      hasOvershootEstimated,
      tableHeaders: [
        {
          text: this.$t('pollutant').toString(),
          value: 'pollutant_name',
          align: 'start',
          cellClass: 'font-weight-bold',
        },
        {
          text: this.$t('period').toString(),
          value: 'averaging_period_name',
          align: 'center',
          cellClass: 'primary--text',
        },
        {
          text: this.$t('value').toString(),
          value: 'value',
          align: 'center',
        },
        {
          text: this.$t('target').toString(),
          value: 'target_value',
          align: 'center',
          cellClass: 'primary--text',
        },
        {
          text: this.$t('unit').toString(),
          value: 'target_unit',
          align: 'center',
          cellClass: 'primary--text',
        },
        {
          text: this.$t('source').toString(),
          value: 'source',
          align: 'center',
          cellClass: 'primary--text',
        },
        {
          text: this.$t('regulation').toString(),
          value: 'regulation_name',
          align: 'center',
          cellClass: 'primary--text',
        },
      ],
      tableItems: _orderBy(tableItems, 'exceeded', 'desc'),
    }
    return tooltipParams
  }
}

const VIOLATIONS_HIGHEST_AMOUNT = 10
const VIOLATIONS_PALETTE_SIZE = 7
const VIOLATIONS_SCALE = chroma.scale([
  theme.colors.orange.base,
  theme.colors.darkRed.base,
])
const PALETTE_COLORS = VIOLATIONS_SCALE.mode('lch').colors(
  VIOLATIONS_PALETTE_SIZE + 1
)
function _getViolationsColor(num: undefined | number): string {
  // no data
  if (num === undefined) return theme.colors.gray.base

  // transparent (in the future for example)
  if (num === -1) return ''

  // no violations
  if (num === 0) return theme.colors.green.base

  // there are violations
  const percentage = num / (VIOLATIONS_HIGHEST_AMOUNT / 100)
  const scaleVal =
    num >= VIOLATIONS_HIGHEST_AMOUNT ? 1 : Math.min(1, percentage / 100)
  return PALETTE_COLORS[Math.round(VIOLATIONS_PALETTE_SIZE * scaleVal)]
}

function _valuePassesFilter(
  filterKey: any,
  filterMap: MapFilter | null
): boolean {
  return !filterMap || (filterKey && filterMap[filterKey])
}
</script>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';
$violations-chart__calendar--width: 170px;

.violations-chart {
  padding: 0 0.5rem 0 0;
  position: relative;

  .banner-outdated {
    position: absolute;
    z-index: 10;
    min-height: 200px;
    height: 100%;

    &:before {
      content: '';
      position: absolute;
      top: -15px;
      left: -10px;
      width: calc(100% + (10px * 2));
      height: calc(100% + (10px * 2));
      background-color: map-get($yellow, lighten-5);
      border-radius: 5px;
      opacity: 0.7;
    }

    .v-btn {
      margin-top: 100px;
    }
  }

  .chart-row {
    position: relative;
    margin: 0 0 1rem 0;

    &__title {
      width: 100%;
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 3;
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
      padding: 0.5rem 0.3rem 1.5rem;
      overflow: visible;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;

      &__title {
        min-height: auto;
        max-height: 20px;
        width: $violations-chart__calendar--width;
        text-align: left;
        border-radius: 3px;
        padding: 0 4px;
        margin-bottom: 0.5rem;

        .v-list-item__content {
          padding: 0;
        }

        .v-list-item__title {
          font-size: 1.15em;
          line-height: 1.4em;
        }
      }

      &__calendar.v-calendar {
        border: 0;
        height: auto;
        min-height: fit-content;

        .v-calendar-weekly__head,
        .v-calendar-weekly__week {
          min-height: 21px + (2px * 2);
          justify-content: center;

          .v-calendar-weekly__head-weekday,
          .v-calendar-weekly__day {
            border: 0;
            background: none;
            flex: 1 0 auto;
            padding: 0;
            min-width: 21px;
            max-width: 21px;
            height: 21px;
            margin: 2px;
          }
        }

        .v-calendar-weekly__head {
          .v-calendar-weekly__head-weekday {
            color: var(--v-grey-base);
            line-height: 21px;
          }
        }

        .v-calendar-weekly__week {
          .v-calendar-weekly__day {
            .v-calendar-weekly__day-label {
              display: none;
              margin: 0;
            }

            .v-btn {
              border-radius: 3px;
              min-width: 21px;
              width: 21px;
              height: 21px;
              padding: 0;
              display: flex;

              &.not-interactive {
                cursor: auto !important;
                pointer-events: none;
              }

              &.v-btn--striped {
                &::after {
                  content: '';
                  pointer-events: none;
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  top: 0;
                  background-size: auto auto;
                  background-color: transparent;
                  background-image: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 3px,
                    rgba(255, 255, 255, 0.5) 3px,
                    rgba(255, 255, 255, 0.5) 4px
                  );
                }

                .v-btn__content {
                  color: white;
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

.violations-chart__calendar__day-menu {
  contain: initial;
  overflow: visible;
  margin-top: -6px;
  margin-left: -10px;

  &::before {
    position: absolute;
    content: '';
    width: 10px;
    height: 14px;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 7px solid #fff;
    bottom: -13px;
    left: 8px;
    z-index: 20;
    transform-origin: center top;
    filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.2));
  }
}
</style>
