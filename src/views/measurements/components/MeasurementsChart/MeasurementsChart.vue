<template>
<v-container
  class="measurements-chart"
  fluid
>

  <template v-if="isLoading">
    <v-row>
      <v-col v-for="city of queryCities" :key="city.id">
        <v-skeleton-loader type="text, image" />
      </v-col>
    </v-row>
  </template>

  <template v-else-if="!measurements.length">
    <v-alert class="text-center ma-12" color="grey lighten-3">
      {{ $t('msg.no_data') }}
    </v-alert>
  </template>

  <template v-else>
    <v-row
      v-for="(row, rowIndex) of charts.rows"
      :key="row.id"
      class="chart--row"
    >

      <v-col
        v-for="col of row.cols"
        :key="col.id"
        class="chart--col"
      >
        <div
          v-if="rowIndex === 0"
          class="chart--col--title blue"
        >
          {{ col.title }}
        </div>

        <Plotly
          :ref="`chart:${col.id}`"
          :data="col.data"
          :layout="col.layout"
          :displaylogo="false"
          :display-mode-bar="col.isEmpty ? false : 'hover'"
          @relayout="onRelayout(`chart:${col.id}`, $event)"
        />
      </v-col>

      <div class="chart--row--title blue">
        {{ row.title }}
      </div>
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

@Component({
  components: {
    Plotly,
  }
})
export default class MeasurementsChart extends Vue {
  @Prop() public readonly query!: MeasurementsQuery
  public displayMode: ChartDisplayModes = ChartDisplayModes.NORMAL
  private cities: City[] = []
  private pollutants: Pollutant[] = []
  private measurements: Measurement[] = []
  private isLoading: boolean = false

  private get queryCities (): City[] {
    return this.query.cities || []
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
        const isEmpty: boolean = !data.length

        const col: ChartCol = {
          id: `${rowId}--${colId}`,
          title: city.name,
          data,
          isEmpty,
          rangeBox: chartData.rangeBox,
          layout: {
            showlegend: this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS && last,
            legendfont: {
              size: 12,
              color: '#212121',
            },
            plot_bgcolor: '#fcfcfc',
            paper_bgcolor: '#fff',
            hovermode: 'closest',
            dragmode: 'pan',
            autosize: true,
            margin: {
              l: first && !isEmpty ? 60 : 10,
              r: last ? 40 : 10,
              b: 60,
              t: 10,
              pad: 0,
            },
            xaxis: {
              visible: !isEmpty,
              linecolor: '#eee',
              linewidth: 1,
              mirror: true,
              tickfont: {
                size: 12,
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
                size: 12,
                color: '#bbb',
              },
              tickfont: {
                size: 12,
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
                  size: 28
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

  public async refresh () {
    this.isLoading = true
    this.displayMode = this.query.displayMode || ChartDisplayModes.NORMAL
    await this.fetch()
    this.isLoading = false
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
      const match = measurement.location_id === cityId &&
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

  private onRelayout (refId: string, $event: any) {
    if (!$event || Object.entries($event).length === 0) return
    const hasAxisX = Object.keys($event).find(key => /^xaxis/.test(key))
    if (!hasAxisX) return

    for (const _refId in this.$refs) {
      if (_refId === refId) continue

      const $refList = this.$refs[_refId] as any[]
      const $ref: typeof Plotly = $refList?.[0]
      if (!$ref) continue

      const x = $ref?.layout?.xaxis || {}

      if ($event['xaxis.autorange'] && x.autorange) continue
      if (x.range[0] !== $event['xaxis.range[0]'] ||
        x.range[1] !== $event['xaxis.range[1]']) {

        const update = {
          'xaxis.range[0]': $event['xaxis.range[0]'],
          'xaxis.range[1]': $event['xaxis.range[1]'],
          'xaxis.autorange': $event['xaxis.autorange'],
        }
        $ref.relayout(update)
      }
    }
  }

  @Watch('isLoading')
  @Emit('loading')
  onChangeLoading () {
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
$measurements-chart--title__height: 1.5rem;

.measurements-chart {
  padding-top: $measurements-chart--title__height;
  padding-right: $measurements-chart--title__height;
  padding-left: 0;

  .chart--row {
    position: relative;
    margin: 0 0 1rem 0;

    &--title {
      position: absolute;
      height: 100%;
      width: $measurements-chart--title__height;
      right: -$measurements-chart--title__height;
      top: 0;
      padding: 0;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      text-align: center;
    }

    .chart--col {
      padding: 0 0.3rem;

      &--title {
        text-align: center;
        height: $measurements-chart--title__height;
        margin-top: -$measurements-chart--title__height;
      }
    }
  }
}
</style>