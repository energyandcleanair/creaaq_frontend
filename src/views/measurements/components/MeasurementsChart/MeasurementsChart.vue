<template>
<v-container
  class="measurements-chart"
  fluid
>

  <template v-if="isLoading">
    <v-skeleton-loader class="mb-2" type="image" style="height: 64px;" />

    <v-row class="px-2">
      <template v-for="(city, i) of queryCities">
        <v-col v-if="i < 12 / chartCols" :key="city.id">
          <v-skeleton-loader type="text, image" />
        </v-col>
      </template>
    </v-row>
  </template>

  <template v-else-if="!measurements.length">
    <v-alert class="text-center ma-12" color="grey lighten-3">
      {{ $t('msg.no_data') }}
    </v-alert>
  </template>

  <template v-else>
    <v-row
      v-for="row of charts.rows"
      :key="row.id"
      class="chart-row"
      :class="`chart-row--cols-${chartCols}`"
    >

      <v-list-item
        class="chart-row__title grey lighten-4 primary--text"
        two-line
      >
        <v-list-item-content>
          <v-list-item-subtitle class="grey--text" v-text="$t('pollutant')"/>
          <v-list-item-title v-text="row.title"/>
        </v-list-item-content>
      </v-list-item>

      <v-col
        v-for="col of row.cols"
        class="chart-col"
        :key="col.id"
        :cols="chartCols"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-list-item class="chart-col__title blue" v-bind="attrs" v-on="on">
              <v-list-item-content>
                <v-list-item-title v-text="col.title"/>
              </v-list-item-content>
            </v-list-item>
          </template>
          <span>{{ col.title }}</span>
        </v-tooltip>

        <Plotly
          class-name="ooops"
          :ref="`chart:${col.id}`"
          :id="`chart:${col.id}`"
          :data="col.data"
          :layout="col.layout"
          :config="{responsive: true}"
          :displaylogo="false"
          :display-mode-bar="col.isEmpty ? false : 'hover'"
          @relayout="onRelayout(row.id, col.id, $refs[`chart:${col.id}`][0], $event)"
        />
      </v-col>
    </v-row>
  </template>
</v-container>
</template>

<script lang="ts">
import to from 'await-to-js'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _sortBy from 'lodash.sortby'
import _groupBy from 'lodash.groupby'
import moment from 'moment'
import { Framework } from 'vuetify'
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import { Plotly } from 'vue-plotly'
import MeasurementAPI from '@/api/MeasurementAPI'
import Measurement from '@/entities/Measurement'
import Pollutant from '@/entities/Pollutant'
import City from '@/entities/City'
import POLLUTANTS from '@/constants/pollutants.json'
import MeasurementsQuery from './MeasurementsQuery'
import ChartDisplayModes from './ChartDisplayModes'
import ChartsParams from './ChartsParams'
import RangeBox from './RangeBox'
import ChartRow from './ChartRow'
import ChartCol from './ChartCol'
import ChartTrace from './ChartTrace'
import ChartData from './ChartData'
import ChartColumnSize from '../../types/ChartColumnSize'

const COL_ID_DIVIDER = '--'

@Component({
  components: {
    Plotly,
  }
})
export default class MeasurementsChart extends Vue {
  @Prop() public readonly query!: MeasurementsQuery
  @Prop({type: Number}) public readonly cols!: ChartColumnSize
  public displayMode: ChartDisplayModes = ChartDisplayModes.NORMAL
  private cities: City[] = []
  private pollutants: Pollutant[] = []
  private measurements: Measurement[] = []
  private isLoading: boolean = false

  private get queryCities (): City[] {
    return this.query.cities || []
  }

  private get chartCols (): number /* Vuetify <v-col> size: [1, 12] */ {
    const columns = !this.cols
      ? MeasurementsChart.getDefaultChartCols(this.$vuetify)
      : this.cols

    return 12 / columns
  }

  private get colWidth (): number {
    let w = this.$el.clientWidth || 100
    const PADDING = 10
    w -= PADDING * 2
    return (w / this.cols) || w
  }

  private get charts (): ChartsParams {
    if (this.isLoading) {
      return {rows: [], displayMode: this.displayMode}
    }

    const rows: ChartRow[] = []

    for (const pollutant of this.pollutants) {
      const rowId: string = pollutant.id
      const cols: ChartCol[] = []

      for (const i in this.cities) {
        const city = this.cities[+i]
        const colId = city.id
        const chartData = this.genChartData(city.id, pollutant.id)
        const first = +i === 0
        const last = +i === this.cities.length - 1

        const data = chartData.data.map(trace => {
          trace.x = trace.x.map(val => new Date(val))
          return trace
        })
        const isEmpty: boolean = !data?.length ||
          (!data[0]?.x?.length && !data[0]?.y?.length)

        const xs = this.colWidth < 80
        const sm = this.colWidth < 140
        const font = xs
          ? 8
          : sm
            ? 10
            : 12

        const margin = {
          l: first && !isEmpty ? 60 : 10,
          r: last ? 40 : 10,
          b: 60,
          t: 10,
          pad: 0,
        }

        const col: ChartCol = {
          id: `${rowId}${COL_ID_DIVIDER}${colId}`,
          title: city.name,
          data,
          isEmpty,
          rangeBox: chartData.rangeBox,
          layout: {
            showlegend: this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS && last,
            legendfont: {
              size: font,
              color: '#212121',
            },
            plot_bgcolor: '#fcfcfc',
            paper_bgcolor: '#fff',
            hovermode: 'closest',
            dragmode: 'pan',
            autosize: true,
            width: this.colWidth,
            height: Math.max(this.colWidth, margin.b * 2),
            margin: margin,
            xaxis: {
              visible: !isEmpty,
              linecolor: '#eee',
              linewidth: 1,
              mirror: true,
              tickfont: {
                size: font,
                color: '#212121',
              },
              tickformat: this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS
                ? '%d %b'
                : '%d %b %Y',
            },
            yaxis: {
              visible: !isEmpty,
              title: first ? pollutant.unit : undefined,
              titlefont: {
                size: font,
                color: '#bbb',
              },
              tickfont: {
                size: font,
                color: '#212121',
              },
              showticklabels: first,
              linecolor: '#eee',
              linewidth: 1,
              mirror: true,
            },
            ...(!isEmpty ? {} : {
              annotations: [{
                text: this.$t('msg.no_data'),
                xref: 'paper',
                yref: 'paper',
                showarrow: false,
                font: {
                  size: font * 1.5
                }
              }]
            })
          },
        }
        cols.push(col)
      }

      const row: ChartRow = {
        id: rowId,
        title: pollutant.label,
        cols,
        rangeBox: _genRangeBox(cols),
      }
      rows.push(row)
    }

    // set one grid range to all charts
    const MARGIN = 3
    const rangeBox = _genRangeBox(rows)
    const generalRangeX = [rangeBox.x0 - MARGIN, rangeBox.x1 + MARGIN]
    const generalRangeY = [rangeBox.y0 - MARGIN, rangeBox.y1 + MARGIN]
    for (const row of rows) {
      for (const col of row.cols) {
        _set(col, 'layout.xaxis.range', generalRangeX.slice())
        _set(col, 'layout.yaxis.range', generalRangeY.slice())
      }
    }

    return {
      displayMode: this.displayMode || ChartDisplayModes.NORMAL,
      rows,
    }
  }

  private created () {
    this.refresh()
  }

  private mounted () {
    if (!this.cols) {
      this.$emit('update:cols', MeasurementsChart.getDefaultChartCols(this.$vuetify))
    }
  }

  public async refresh () {
    this.isLoading = true
    this.displayMode = this.query.displayMode || ChartDisplayModes.NORMAL
    await this.fetch()
    this.isLoading = false
  }

  static getDefaultChartCols ($vuetify: Framework): ChartColumnSize {
    switch ($vuetify.breakpoint.name) {
      case 'xs': return 1
      case 'sm': return 1
      case 'md': return 2
      case 'lg': return 4
      case 'xl': return 6
      default: return 1
    }
  }

  private async fetch () {
    this.isLoading = true

    const measurements = await this.fetchMeasurements(this.query)

    const pollutantsMap = measurements
      .reduce((memo: {[pollutantId: string]: Pollutant}, meas: Measurement) => {
        if (meas.pollutant && !memo[meas.pollutant]) {
          const pollutant = POLLUTANTS.find(i => i.id === meas.pollutant)
          if (pollutant) {
            memo[meas.pollutant] = {...pollutant, unit: meas.unit}
          }
        }
        return memo
      }, {})
    const pollutants = _sortBy(Object.values(pollutantsMap), 'id')

    this.cities = this.query.cities.slice()
    this.measurements = measurements
    this.pollutants = pollutants
    this.isLoading = false
  }

  private async fetchMeasurements (query: MeasurementsQuery): Promise<Measurement[]> {
    const q: string = MeasurementsQuery.toQueryString(query)

    const [err, measurements] = await to(MeasurementAPI.findAll(q))
    if (err) {
      this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
      console.error(err)
      return []
    }
    return measurements || []
  }

  private genChartData (
    cityId: City['id'],
    pollutantId: Pollutant['id']
  ): ChartData {
    const points: {
      x: number
      y: number
      $date: moment.Moment
      $origDate: moment.Moment
    }[] = []
    const rangeBox: RangeBox = {
      x0: -Infinity,
      y0: -Infinity,
      x1: Infinity,
      y1: Infinity,
    }

    for (const measurement of this.measurements) {
      const match = measurement.city_id === cityId &&
        measurement.pollutant === pollutantId

      if (!match) continue

      const $origDate = moment(measurement.date)
      const $date = moment(measurement.date)

      if (this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS) {
        $date.year(1970)
      }

      const x = $date.valueOf()
      const y = measurement.value

      if (rangeBox.x0 === -Infinity || x < rangeBox.x0) rangeBox.x0 = x
      if (rangeBox.x1 === Infinity || x > rangeBox.x1) rangeBox.x1 = x
      if (rangeBox.y0 === -Infinity || y < rangeBox.y0) rangeBox.y0 = y
      if (rangeBox.y1 === Infinity || y > rangeBox.y1) rangeBox.y1 = y

      points.push({x, y, $date, $origDate})
    }

    // draw multiple lines for SUPERIMPOSED_YEARS mode
    const pointsGroups = this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS
      ? _groupBy(points, point => point.$origDate.year())
      : [points]

    const traces: ChartTrace[] = Object.values(pointsGroups).map(pointsGroup => {
      const trace: ChartTrace = {
        x: [],
        y: [],
        type: 'scatter',
        name: pointsGroup[0]?.$origDate.format('YYYY')
      }

      for (const point of pointsGroup) {
        trace.x.push(point.x)
        trace.y.push(point.y)
      }

      return trace
    })

    return {
      data: traces,
      rangeBox,
    }
  }

  private onRelayout (
    rowId: ChartRow['id'],
    colId: ChartCol['id'],
    $colRef: HTMLElement,
    $event: any
  ) {

    if (!$event || Object.entries($event).length === 0) return
    const hasAxisX = Object.keys($event).find(key => /^xaxis/.test(key))
    if (!hasAxisX) return

    for (const refId in this.$refs) {
      if (refId === $colRef.id) continue

      const $refList = this.$refs[refId] as any[]
      const $ref: typeof Plotly = $refList?.[0]
      if (!$ref) continue

      const chartParams: string[] = refId
        .replace('chart:', '')
        .split(COL_ID_DIVIDER)
      const chartRowId: ChartRow['id'] = chartParams[0]

      const paramsToUpdate: {[key: string]: any} = {}

      // x-axis is shared across all plots
      const x = $ref?.layout?.xaxis || {}
      const evt_x_range0 = $event['xaxis.range[0]']
      const evt_x_range1 = $event['xaxis.range[1]']
      if (!(x.autorange && $event['xaxis.autorange']) &&
        (x.range[0] !== evt_x_range0 || x.range[1] !== evt_x_range1)
      ) {
        Object.assign(paramsToUpdate, {
          'xaxis.range[0]': $event['xaxis.range[0]'],
          'xaxis.range[1]': $event['xaxis.range[1]'],
          'xaxis.autorange': $event['xaxis.autorange'],
        })
      }

      // y-axes shared only within one row (pollutant)
      if (chartRowId === rowId) {
        const y = $ref?.layout?.yaxis || {}
        const evt_y_range0 = $event['yaxis.range[0]']
        const evt_y_range1 = $event['yaxis.range[1]']
        if (!(y.autorange && $event['yaxis.autorange']) &&
          (y.range[0] !== evt_y_range0 || y.range[1] !== evt_y_range1)
        ) {
          Object.assign(paramsToUpdate, {
            'yaxis.range[0]': $event['yaxis.range[0]'],
            'yaxis.range[1]': $event['yaxis.range[1]'],
            'yaxis.autorange': $event['yaxis.autorange'],
          })
        }
      }

      if (Object.keys(paramsToUpdate).length) {
        $ref.relayout(paramsToUpdate)
      }
    }
  }

  @Watch('isLoading')
  @Emit('loading')
  private onChangeLoading () {
    return this.isLoading
  }
}

function _genRangeBox (items: any): RangeBox {
  const rangeBox: RangeBox = {
    x0: -Infinity,
    y0: -Infinity,
    x1: Infinity,
    y1: Infinity,
  }

  for (const item of items) {
    const x0 = _get(item, 'rangeBox.x0')
    const y0 = _get(item, 'rangeBox.y0')
    const x1 = _get(item, 'rangeBox.x1')
    const y1 = _get(item, 'rangeBox.y1')

    if (rangeBox.x0 === -Infinity || x0 < rangeBox.x0) rangeBox.x0 = x0
    if (rangeBox.x1 === Infinity || x1 > rangeBox.x1) rangeBox.x1 = x1
    if (rangeBox.y0 === -Infinity || y0 < rangeBox.y0) rangeBox.y0 = y0
    if (rangeBox.y1 === Infinity || y1 > rangeBox.y1) rangeBox.y1 = y1
  }

  return rangeBox
}
</script>

<style lang="scss">
.measurements-chart {
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

    &--cols-1,
    &--cols-2 {
      .chart-col {
        .chart-col__title {
          .v-list-item__title {
            font-size: 0.8em;
          }
        }
      }
    }
  }
}
</style>