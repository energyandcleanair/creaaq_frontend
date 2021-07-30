<template>
<v-container
  class="measurements-chart"
  :class="{
    'measurements-chart--dense': dense
  }"
  fluid
  v-resize="onResize"
>

  <template v-if="loading">
    <v-skeleton-loader class="mb-2" type="image" style="height: 64px;" />

    <v-row class="px-2">
      <template v-for="i of (cols || 2)">
        <v-col :key="i">
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
      v-for="row of chartsRows"
      :key="row.id"
      class="chart-row"
      :class="{
        [`chart-row--cols-${vCols}`]: true,
        [`col col-${vCols}`]: dense,
        'chart-row--hidden': !checkPollutantVisibility(row.pollutantId)
      }"
    >

      <v-list-item
        class="chart-row__title grey lighten-4 primary--text"
        two-line
      >
        <v-list-item-content>
          <v-list-item-title>
            <span class="font-weight-bold">{{ row.title }}</span>
            <i
              v-if="row.subtitle"
              class="grey--text text--darken-1 pl-1"
              style="font-size: 0.6em;"
              v-text="row.subtitle"
            />
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-col
        v-for="col of row.cols"
        class="chart-col"
        :key="col.id"
        :cols="vCols"
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
import moment from 'moment'
import chroma from 'chroma-js'
import _get from 'lodash.get'
import _set from 'lodash.set'
import _merge from 'lodash.merge'
import _orderBy from 'lodash.orderby'
import _debounce from 'lodash.debounce'
import { Framework } from 'vuetify'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Plotly } from 'vue-plotly'
import { URL_DATE_FORMAT, toNumberDate, computeMovingAverage } from '@/utils'
import Measurement, { MeasurementProcesses } from '@/entities/Measurement'
import Pollutant from '@/entities/Pollutant'
import City from '@/entities/City'
import Source from '@/entities/Source'
import Station from '@/entities/Station'
import theme from '@/theme'
import RunningAverageEnum, { RUNNING_AVERAGE_DAYS_MAP } from '../../types/RunningAverageEnum'
import ChartColumnSize from './ChartColumnSize'
import URLQuery from '../../types/URLQuery'
import ChartDisplayModes from './ChartDisplayModes'
import RangeBox from './RangeBox'
import ChartRow from './ChartRow'
import ChartCol from './ChartCol'
import ChartTrace, { ChartTraceLevels } from './ChartTrace'
import ChartTracePoint from './ChartTracePoint'
import ChartData from './ChartData'

const COL_ID_DIVIDER = '--'
const PRIMARY_LINE_STYLE = {
  color: theme.colors.darkBlue.darken1,
  width: 2,
  minWidth: 1.5,
  maxWidth: 3.5,
  widthStep: 0.3
}
const SECONDARY_LINE_STYLE = {color: '#ddd', width: 1}
const PRIMARY_TRACE_COLOR_SCALE = chroma
  .scale([theme.colors.darkBlue.darken1, 'blue', 'purple', 'red', 'orange', 'green']);

interface MapFilter {
  [id: string]: number
}

@Component({
  components: {
    Plotly,
  }
})
export default class MeasurementsChart extends Vue {

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop()
  public readonly chartData!: ChartData

  @Prop({type: Number})
  public readonly cols?: ChartColumnSize

  @Prop({default: ChartDisplayModes.NORMAL})
  public readonly chartDisplayMode!: ChartDisplayModes

  @Prop({type: String})
  public readonly runningAverage?: RunningAverageEnum

  @Prop({type: Boolean, default: false})
  public readonly loading!: boolean

  @Prop({type: Boolean, default: false})
  public readonly displayStations!: boolean

  @Prop({type: Array, default: () => []})
  public readonly filterSources!: Source['id'][]

  @Prop({type: Array, default: () => []})
  public readonly filterPollutants!: Pollutant['id'][]

  @Prop({type: Array, default: () => []})
  public readonly filterStations!: Station['id'][]

  private get cities (): City[] {
    return this.chartData.cities || []
  }

  private get pollutants (): Pollutant[] {
    return this.chartData.pollutants || []
  }

  private get measurements (): Measurement[] {
    return this.chartData.measurements || []
  }

  // display pollutants as cells and not rows
  private get dense (): boolean {
    return this.queryParams.cities?.length === 1
  }

  private get displayMode (): ChartDisplayModes {
    return this.chartDisplayMode || ChartDisplayModes.NORMAL
  }

  private get _cols (): ChartColumnSize {
    const maxChartCols = MeasurementsChart.getMaxChartCols(
      this.$vuetify,
      this.queryParams.cities.length,
      this.queryParams.pollutants.length,
    )
    return Math.min(this.cols || 0, maxChartCols) as ChartColumnSize
  }

  private get vCols (): number /* Vuetify <v-col> size: [1, 12] */ {
    return 12 / this._cols
  }

  private get colWidth (): number {
    let w = this.$el?.clientWidth || 300
    const PADDING = 10
    w -= PADDING * 2
    return (w / (this._cols || 1)) || w
  }

  // TODO: to improve the performance we can separate the data and display opts
  // TODO: add chaching of traces that were not updated
  private get chartsRows (): ChartRow[] {
    if (this.loading) return []

    const rows: ChartRow[] = []
    const xs = this.colWidth < 100
    const sm = this.colWidth < 160
    const font = xs
      ? 8
      : sm
        ? 10
        : 12

    let filterPollutants: MapFilter|null = this.queryParams.pollutants
      .reduce((memo: MapFilter, id: Pollutant['id']) => (memo[id] = 1) && memo, {})
    if (!Object.keys(filterPollutants).length) filterPollutants = null

    for (const pollutant of this.pollutants) {
      if (!_valuePassesFilter(pollutant.id, filterPollutants)) continue

      const rowId: string = pollutant.id
      const cols: ChartCol[] = []

      for (const _i in this.queryParams.cities) {
        const i = +_i
        const cityId = this.queryParams.cities[i]
        const city = this.chartData.cities.find(i => i.id === cityId)
        if (!city) continue

        const colId = city.id
        const first = i % this._cols === 0
        const last = i % this._cols === this._cols - 1
          || i === this.cities.length - 1
        const chartTraces = this.genChartTraces(
          city,
          pollutant,
          this.filterSources,
          this.filterStations
        )

        const data = chartTraces.traces.map(trace => {
          trace.x = trace.x.map(val => new Date(val))
          return trace
        })
        const isEmpty: boolean = !data?.length ||
          (!data[0]?.x?.length && !data[0]?.y?.length)

        const showlegend = this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS && last
        const showticklabelsY = !isEmpty &&
          (first || cols[i - 1]?.isEmpty === true)

        const margin = _genChartMargins({font, showticklabelsY, showlegend})
        const layout = this._getChartLayoutDefaults({
          margin,
          font,
          colWidth: this.colWidth,
          displayMode: this.displayMode,
          isEmpty
        })

        const col: ChartCol = {
          id: `${rowId}${COL_ID_DIVIDER}${colId}`,
          title: city.name,
          data,
          isEmpty,
          rangeBox: chartTraces.rangeBox,
          layout: _merge(layout, {
            showlegend: showlegend,
            yaxis: {
              showticklabels: showticklabelsY,
            }
          }),
        }
        cols.push(col)
      }

      const row: ChartRow = {
        id: rowId,
        pollutantId: pollutant.id,
        title: pollutant.label,
        subtitle: pollutant.unit,
        cols,
        rangeBox: _mergeItemsRangeBoxes(cols, 'rangeBox'),
      }

      // align the charts margins and legends
      for (const i in row.cols) {
        const col = row.cols[i]
        const colNext = row.cols[+i + 1]
        const showticklabelsY = col.layout.yaxis.showticklabels
        let showlegend = col.layout.showlegend
        if (!showlegend &&
          this.displayMode !== ChartDisplayModes.NORMAL &&
          (!colNext || colNext.isEmpty)
        ) {
          showlegend = true
          const margin = _genChartMargins({font, showticklabelsY, showlegend})
          col.layout.showlegend = showlegend
          col.layout.margins = margin
        }
      }

      // set one grid range to all charts in row
      row.cols = _alignColsGridRange(
        row.cols,
        row.rangeBox,
        this.displayMode,
        {
          dateStart: this.queryParams.date_start,
          dateEnd: this.queryParams.date_end,
        }
      )

      rows.push(row)
    }

    return rows
  }

  private mounted () {
    if (!this.cols) {
      this.$emit(
        'update:cols',
        MeasurementsChart.getMaxChartCols(
          this.$vuetify,
          this.queryParams.cities.length,
          this.queryParams.pollutants.length,
        )
      )
    }
  }

  static getDefaultChartColsBasedOnWindow ($vuetify: Framework): ChartColumnSize {
    switch ($vuetify.breakpoint.name) {
      case 'xs': return 1
      case 'sm': return 1
      case 'md': return 2
      case 'lg': return 3
      case 'xl': return 4
      default: return 2
    }
  }

  static getMaxChartCols (
    $vuetify: Framework,
    citiesLength: number = 0,
    pollutantsLength: number = 0,
  ): ChartColumnSize {
    const rowItemsLength = citiesLength === 1 ? pollutantsLength : citiesLength
    const defaultChartCols = MeasurementsChart.getDefaultChartColsBasedOnWindow($vuetify)
    let _defaultCols: number = rowItemsLength ? rowItemsLength : defaultChartCols

    if (_defaultCols > 4 && _defaultCols < 6) _defaultCols = 5
    if (_defaultCols > 6 && _defaultCols < 12) _defaultCols = 6
    if (_defaultCols > 12) _defaultCols = 12

    return _defaultCols as ChartColumnSize
  }

  private genChartTraces (
    city: City,
    pollutant: Pollutant,
    filterSources: Source['id'][],
    filterStations: Station['id'][],
  ): {traces: ChartTrace[], rangeBox: RangeBox} {

    const cityId: City['id'] = city.id
    const pollutantId = pollutant.id
    const dateStart: number = toNumberDate(this.queryParams.date_start || '') || 0
    const dateStartYear: number = dateStart ? moment(dateStart).year() : 0
    const dateEnd: number = toNumberDate(this.queryParams.date_end || '') || 0
    let rangeBox: RangeBox = {
      x0: -Infinity,
      y0: -Infinity,
      x1: Infinity,
      y1: Infinity,
    }

    const tracesMap: {[location_id: string]: ChartTracePoint[]} = {
      [cityId]: [],
    }

    for (const measurement of this.measurements) {
      let traceId: string|undefined

      switch (measurement.process_id) {
        case MeasurementProcesses.city_day_mad: {
          traceId = cityId
          break
        }
        case MeasurementProcesses.station_day_mad: {
          if (!this.displayStations) continue
          const stationId = measurement.location_id
          if (!filterStations.includes(stationId)) continue
          traceId = stationId
          break
        }
        default: {
          console.warn(`Could not determine the measurement process: ${measurement.id}`)
          continue
        }
      }

      const matchCity: boolean = measurement.city_id === cityId
      const matchPollutant: boolean = measurement.pollutant === pollutantId
      const matchSource: boolean = filterSources.length
        ? filterSources.includes(measurement.source)
        : true

      if (!matchCity || !matchPollutant || !matchSource) continue

      const x = +new Date(measurement.date)
      const y = measurement.value

      if (!tracesMap[traceId]) tracesMap[traceId] = []
      tracesMap[traceId].push({x, y})
    }

    let traces: ChartTrace[] = []

    for (const traceId in tracesMap) {
      const tracePoints = tracesMap[traceId]
      const level = traceId === cityId
        ? ChartTraceLevels.CITY
        : ChartTraceLevels.STATION
      const isCalcRunningAverage = this.runningAverage &&
        RUNNING_AVERAGE_DAYS_MAP[this.runningAverage] !== 1 &&
        tracePoints.length
      const hovertemplate = `%{y:.0f} ${pollutant.unit || ''}<br>%{x}` + (
        level === ChartTraceLevels.CITY
          ? `<br><b>${this.$t('city')}:</b> ${city.name}`
          : `<br><b>${this.$t('station')}:</b> ${traceId}`
      )

      const trace: ChartTrace = {
        x: [],
        y: [],
        level: level,
        zIndex: traces.length + (level === ChartTraceLevels.CITY ? 1000 : 0),
        type: 'scatter',
        mode: 'lines',
        name: '',
        hovertemplate,
      }

      for (const point of tracePoints) {
        rangeBox = _extendRangeBox(rangeBox, point.x, point.y)
        trace.x.push(point.x)
        trace.y.push(point.y)
      }

      if (isCalcRunningAverage) {
        const days = RUNNING_AVERAGE_DAYS_MAP[
          this.runningAverage || RunningAverageEnum['1d']
        ] || 1
        const avg = computeMovingAverage(trace.x, trace.y, days)
        trace.x = avg.dates
        trace.y = avg.values
      }

      const cutTrace = _cutTracePointsOverDatesFrame(trace, dateStart, dateEnd)
      trace.x = cutTrace.x
      trace.y = cutTrace.y

      // split the trace into traces by year and overlap each other
      if (this.displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS) {
        const tracesMapByYear: {[year: number]: ChartTrace} = {}

        for (const _i in trace.x) {
          const i = +_i
          const x = trace.x[i]
          const y = trace.y[i]
          const $date = new Date((x as number) - 1)
          const year = $date.getUTCFullYear()

          if (!tracesMapByYear[year]) {
            tracesMapByYear[year] = {
              ...trace,
              zIndex: (trace.zIndex || 0) + Object.keys(tracesMapByYear).length,
              x: [],
              y: [],
              name: year,
            }
          }

          const new_x = +$date.setUTCFullYear(dateStartYear)
          tracesMapByYear[year].x.push(new_x)
          tracesMapByYear[year].y.push(y)
        }

        traces.push(...Object.values(tracesMapByYear))
      } else {
        traces.push(trace)
      }
    }

    traces = _orderBy(traces, ['level', 'zIndex'], ['desc', 'asc'])

    _setLineStylesToChartTraces(traces)

    return {
      traces,
      rangeBox,
    }
  }

  @Watch('cols')
  @Watch('runningAverage')
  @Watch('chartDisplayMode')
  private onResize = _debounce(() => this.resize(), 100)

  public resize () {
    for (const refId in this.$refs) {
      const $refList = this.$refs[refId] as any[]
      const $ref: typeof Plotly = $refList?.[0]
      $ref?.relayout({autosize: true})
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

  private checkPollutantVisibility (pollutantId: Pollutant['id']): boolean {
    const visible = this.filterPollutants.includes(pollutantId)
    return visible
  }

  private _getChartLayoutDefaults (
    opts: {
      margin: {[key: string]: number},
      font: number,
      displayMode: ChartDisplayModes,
      colWidth: number,
      isEmpty: boolean,
    }
  ): ChartCol['layout'] {
    const {
      margin,
      font,
      displayMode,
      colWidth,
      isEmpty,
    } = opts

    return {
      showlegend: false,
      legendfont: {
        size: font,
        color: '#212121',
      },
      plot_bgcolor: '#fcfcfc',
      paper_bgcolor: '#fff',
      hovermode: 'closest',
      dragmode: 'zoom',
      autosize: true,
      width: colWidth,
      height: Math.max(colWidth * (2/3), margin.b * 2),
      margin,
      xaxis: {
        visible: !isEmpty,
        linecolor: '#eee',
        linewidth: 1,
        mirror: true,
        tickfont: {
          size: font,
          color: '#212121',
        },
        tickformat: displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS
          ? '%d %b'
          : '%d %b %Y',
      },
      yaxis: {
        visible: !isEmpty,
        tickfont: {
          size: font,
          color: '#212121',
        },
        showticklabels: true,
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
            size: font * 1.5,
            color: '#bbb',
          }
        }]
      })
    }
  }
}

function _setLineStylesToChartTraces (traces: ChartTrace[]): ChartTrace[] {
  const citiesTracesNumber: number = traces
    .reduce((acc, trace) => acc += (trace.level === ChartTraceLevels.CITY ? 1 : 0), 0)

  const PALETTE_COLORS = PRIMARY_TRACE_COLOR_SCALE
    .mode('lab')
    .colors(citiesTracesNumber)

  let counterCitiesTraces = 0
  const widthStep = PRIMARY_LINE_STYLE.widthStep
  const widthMin = PRIMARY_LINE_STYLE.minWidth
  const widthMax = PRIMARY_LINE_STYLE.maxWidth
  const _lineWidthMax = widthMin + ((citiesTracesNumber - 1) * widthStep)

  for (let i = traces.length - 1; i >=0; i--) {
    const trace = traces[i]

    if (trace.level === ChartTraceLevels.CITY) {
      const width = _lineWidthMax - (counterCitiesTraces * widthStep)
      trace.line = {
        ...PRIMARY_LINE_STYLE,
        color: PALETTE_COLORS[counterCitiesTraces],
        width: Math.min(width, widthMax)
      }
      counterCitiesTraces++
    } else {
      trace.line = SECONDARY_LINE_STYLE
    }
  }

  return traces
}

function _alignColsGridRange (
  cols: ChartCol[],
  rangeBox: RangeBox,
  displayMode: ChartDisplayModes,
  dates: {
    dateStart: string|undefined
    dateEnd: string|undefined
  }
): ChartCol[] {
  const newCols = cols.slice()
  const MARGIN = 3

  let dateStart: number
  let dateEnd: number

  if (displayMode === ChartDisplayModes.SUPERIMPOSED_YEARS) {
    const $dateStart = moment(dates.dateStart, URL_DATE_FORMAT)
    dateStart = +$dateStart.month(0).date(1)
    dateEnd = +moment(dates.dateEnd, URL_DATE_FORMAT)
      .year($dateStart.year()).month(11).date(31)
  } else {
    dateStart = toNumberDate(dates.dateStart || '') || 0
    dateEnd = toNumberDate(dates.dateEnd || '') || 0
  }

  const generalRangeX = [
    dateStart || rangeBox.x0 - MARGIN,
    dateEnd || rangeBox.x1 + MARGIN,
  ]
  const generalRangeY = [rangeBox.y0 - MARGIN, rangeBox.y1 + MARGIN]

  for (const col of newCols) {
    _set(col, 'layout.xaxis.range', generalRangeX.slice())
    _set(col, 'layout.yaxis.range', generalRangeY.slice())
  }

  return newCols
}

function _cutTracePointsOverDatesFrame (
  trace: ChartTrace,
  dateStart: number,
  dateEnd: number
): ChartTrace {

  let indexStart: number|undefined = dateStart
    ? trace.x.findIndex(x => x > dateStart)
    : undefined
  if (typeof indexStart === 'number' && indexStart < 0) indexStart = 0

  let indexEnd: number|undefined = dateEnd
    ? trace.x.findIndex(x => x >= dateEnd)
    : undefined
  if (indexEnd === -1) indexEnd = undefined

  if (indexStart === undefined && indexEnd === undefined) return trace

  const newTrace: ChartTrace = {...trace, x: [], y: []}
  newTrace.x = trace.x.slice(indexStart, indexEnd)
  newTrace.y = trace.y.slice(indexStart, indexEnd)
  return newTrace
}

function _genChartMargins (
  opts: {
    font: number
    showticklabelsY: boolean
    showlegend: boolean
  }
): {[key: string]: number} {
  return {
    l: opts.showticklabelsY ? opts.font * 4 : 10,
    r: opts.showlegend ? opts.font * 3 : 10,
    b: opts.font * 5,
    t: 10,
    pad: 0,
  }
}

function _mergeItemsRangeBoxes (
  items: any,
  propName: string = 'rangeBox'
): RangeBox {

  const rangeBox: RangeBox = {
    x0: -Infinity,
    y0: -Infinity,
    x1: Infinity,
    y1: Infinity,
  }

  for (const item of items) {
    const x0 = _get(item, `${propName}.x0`)
    const y0 = _get(item, `${propName}.y0`)
    const x1 = _get(item, `${propName}.x1`)
    const y1 = _get(item, `${propName}.y1`)

    if (rangeBox.x0 === -Infinity || x0 < rangeBox.x0) rangeBox.x0 = x0
    if (rangeBox.x1 === Infinity || x1 > rangeBox.x1) rangeBox.x1 = x1
    if (rangeBox.y0 === -Infinity || y0 < rangeBox.y0) rangeBox.y0 = y0
    if (rangeBox.y1 === Infinity || y1 > rangeBox.y1) rangeBox.y1 = y1
  }

  return rangeBox
}

function _extendRangeBox (rangeBox: RangeBox, x: number, y: number): RangeBox {
  const _rangeBox = {...rangeBox}

  if (_rangeBox.x0 === -Infinity || x < _rangeBox.x0) _rangeBox.x0 = x
  if (_rangeBox.x1 === Infinity || x > _rangeBox.x1) _rangeBox.x1 = x
  if (_rangeBox.y0 === -Infinity || y < _rangeBox.y0) _rangeBox.y0 = y
  if (_rangeBox.y1 === Infinity || y > _rangeBox.y1) _rangeBox.y1 = y

  return _rangeBox
}

function _valuePassesFilter (
  key: any,
  filterMap: MapFilter|null,
): boolean {
  return !filterMap || (key && filterMap[key])
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

    &--hidden {
      display: none;
    }
  }

  &--dense {
    display: flex !important;
    flex-wrap: wrap !important;
    flex: 1 1 auto !important;
    margin: -12px !important;

    .chart-row {
      flex-basis: 0 !important;
      flex-grow: 1 !important;
      padding: 0.5rem 0.3rem;

      .chart-col {
        flex: 0 0 100% !important;
        max-width: 100% !important;
        padding: 0;

        .chart-col__title {
          display: none;
        }
      }
    }
  }
}
</style>