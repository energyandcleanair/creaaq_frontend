<template>
  <v-container
    class="violations-chart"
    fluid
  >
    <template v-if="loading">
      <v-skeleton-loader
        class="mb-2"
        type="image"
        style="height: 64px;"
      />

      <v-row class="px-2">
        <template v-for="i of (12 / vCols)">
          <v-col :key="i">
            <v-skeleton-loader type="text, image" />
          </v-col>
        </template>
      </v-row>
    </template>

    <template v-else-if="!violations.length">
      <v-alert
        class="text-center ma-12"
        color="grey lighten-3"
      >
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

            <template v-slot:day="{ day, outside, future }">
              <template v-if="outside">
                <!-- empty -->
              </template>

              <v-btn
                v-else-if="future || !col.dates[day]"
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
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-if="!outside"
                    :color="col.dates[day].color || 'white'"
                    :ripple="false"
                    small
                    depressed
                    v-bind="attrs"
                    v-on="on"
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
import moment, {Moment} from 'moment'
import {Component, Vue, Prop, Ref} from 'vue-property-decorator'
import {Plotly} from 'vue-plotly'
import {URL_DATE_FORMAT} from '@/utils'
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
import Guideline from '@/entities/Guideline'

const COL_ID_DIVIDER = '--'

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

interface TooltipParams {
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

  private tooltip: TooltipParams = TOOLTIP_DEFAULTS
  private tooltips: any[] = []

  private get cities(): City[] {
    return this.chartData.cities || []
  }

  private get violations(): Violation[] {
    return this.chartData.violations || []
  }

  private get pollutants(): Pollutant[] {
    return this.chartData.pollutants || []
  }

  private get guidelines(): Guideline[] {
    return this.chartData.guidelines || []
  }

  private get targets(): Target[] {
    return this.chartData.targets || []
  }

  private get vCols(): number /* Vuetify <v-col> size: [1, 12] */ {
    const b = this.$vuetify.breakpoint
    if (b.width >= 1620) return 2
    if (b.width >= 1300) return 3
    if (b.width >= 1100) return 4
    if (b.width >= 600) return 6
    return 12
  }

  private get filteredViolations(): Violation[] {
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

    // TODO: complete this filter
    // let filterGuidelines: MapFilter | null = this.queryParams.guidelines.reduce(
    //   (memo: MapFilter, id: Guideline['id']) => (memo[id] = 1) && memo,
    //   {}
    // )
    // if (!Object.keys(filterGuidelines).length) filterGuidelines = null

    let filterTargets: MapFilter | null = this.queryParams.targets.reduce(
      (memo: MapFilter, id: Target['id']) => (memo[id] = 1) && memo,
      {}
    )
    if (!Object.keys(filterTargets).length) filterTargets = null

    for (const violation of this.violations) {
      const cityId = violation.location_id

      if (
        !_valuePassesFilter(cityId, filterCities) ||
        !_valuePassesFilter(violation.pollutant, filterPollutants) ||
        // !_valuePassesFilter(violation.guideline, filterGuidelines) ||
        !_valuePassesFilter(violation.target_id, filterTargets)
      ) {
        continue
      }

      violations.push(violation)
    }

    return violations
  }

  private get chartRows(): ChartRow[] {
    if (this.loading) return []
    if (!this.queryParams.cities?.length) return []

    const citiesCalendars: {[cityId: string]: ViolationsCalendar} = {}
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
      const violationsCalendar: ViolationsCalendar = citiesCalendars[city.id]

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

            const violationsNum: number =
              +$date >= _tomorrow ? -1 : dateViolations?.length || -1

            col.dates[date] = {
              color: _getViolationsColor(violationsNum),
              violations: dateViolations || [],
              tooltip: this.genDateTooltipParams(
                $date,
                dateViolations || [],
                this.chartData.targets || []
              ),
            }
          }

          row.cols.push(col)
        }
      }

      rows.push(row)
    }

    return rows
  }

  private weekdayFormatter(dayProps: any) {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayProps.weekday]
  }

  private genDateTooltipParams(
    $date: Moment,
    violations: Violation[],
    targets: Target[]
  ): TooltipParams {
    let numRedViolations = 0

    const tableItems = violations.map((item) => {
      const target = targets.find((i) => i.id === item.target_id)
      const value = Math.round(item.value || 0)
      const target_value = Math.round(item.target_value || 0)
      const exceeded = value > target_value
      if (exceeded) numRedViolations++
      return {
        exceeded,
        class: exceeded ? 'red--text' : 'green--text',
        title: target?.name || item.guideline || item.pollutant || '?',
        pollutant: item.pollutant || '?',
        value: value,
        target_value: target_value,
      }
    })

    const tooltipParams: any = {
      title: (
        numRedViolations +
        ' ' +
        (numRedViolations <= 1 ? this.$t('violation') : this.$t('violations'))
      ).toLowerCase(),
      subtitle: $date.format('D MMMM YYYY'),
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
function _getViolationsColor(num: number): string {
  if (num === -1) return ''
  if (num === 0) return theme.colors.green.base
  const percentage = num / (VIOLATIONS_HIGHEST_AMOUNT / 100)
  const scaleVal =
    num >= VIOLATIONS_HIGHEST_AMOUNT ? 1 : Math.min(1, percentage / 100)
  return PALETTE_COLORS[Math.round(VIOLATIONS_PALETTE_SIZE * scaleVal)]
}

function _valuePassesFilter(key: any, filterMap: MapFilter | null): boolean {
  return !filterMap || (key && filterMap[key])
}
</script>

<style lang="scss">
$violations-chart__calendar--width: 170px;

.violations-chart {
  padding: 0 0.5rem 0 0;
  position: relative;

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