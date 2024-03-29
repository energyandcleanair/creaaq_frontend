<template>
  <PageDrawer :open="open" :show-open-button="false" @input="toggle($event)">
    <v-form>
      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{
          $t('display_mode')
        }}</v-col>

        <v-col class="d-flex justify-center" cols="12">
          <v-select
            class="mt-0 pt-2"
            :value="displayMode"
            :items="DISPLAY_MODES"
            item-text="label"
            item-value="value"
            hide-details
            @change="onChangeForm('display_mode', $event)"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{
          $t('running_average')
        }}</v-col>

        <v-col class="d-flex justify-center mt-2" cols="12">
          <v-btn-toggle
            :value="runningAverage"
            color="primary"
            tile
            group
            @change="onChangeForm('running_average', $event)"
          >
            <v-btn
              class="px-1"
              v-for="val of RUNNING_AVERAGE_OPTIONS"
              :key="val"
              :value="val"
              v-text="val"
              small
              style="text-transform: none"
            />
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{
          $t('chart_columns')
        }}</v-col>

        <v-col class="d-flex justify-center mt-2" cols="12">
          <v-slider
            :value="chartCols"
            color="primary"
            :min="CHART_SIZE_VALUES.min"
            :max="CHART_SIZE_VALUES.max || 1"
            :disabled="CHART_SIZE_VALUES.max === 0"
            step="1"
            ticks="always"
            tick-size="2"
            hide-details
            thumb-label
            :thumb-size="18"
            @change="onChangeForm('chart_cols', CHART_SIZE_LABELS[$event])"
          >
            <template v-slot:thumb-label="{value}">
              {{ CHART_SIZE_LABELS[value] }}
            </template>
          </v-slider>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('sources') }}</v-col>

        <v-col v-if="chartData.sources.length" class="d-flex pl-1" cols="12">
          <v-radio-group
            :value="queryParams.sources && queryParams.sources[0]"
            color="primary"
            hide-details
            @change="onChangeForm('sources', [$event])"
          >
            <v-radio
              v-for="item of chartData.sources"
              :key="item.id"
              :label="item.short_name || item.name"
              :value="item.id"
            >
              <template v-slot:label>
                <v-menu bottom open-on-hover>
                  <template v-slot:activator="{on, attrs}">
                    {{ item.short_name || item.name }}
                    <v-icon
                      class="ml-1"
                      v-bind="attrs"
                      v-on="on"
                      color="grey lighten-2"
                      small
                    >
                      {{ mdiInformationOutline }}
                    </v-icon>
                  </template>

                  <v-card>
                    <v-card-title
                      v-text="
                        item.name +
                        (item.short_name && item.short_name !== item.name
                          ? ` (${item.short_name})`
                          : '')
                      "
                    />
                    <v-card-text v-if="item.url">
                      <a :href="item.url" target="_blank" v-text="item.url" />
                    </v-card-text>
                  </v-card>
                </v-menu>
              </template>
            </v-radio>
          </v-radio-group>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('pollutants') }}</v-col>

        <v-col v-if="chartData.pollutants.length" class="pl-1" cols="12">
          <v-checkbox
            v-for="item of chartData.pollutants"
            :input-value="queryParams.pollutants"
            :key="item.id"
            :value="item.id"
            :label="item.name"
            color="primary"
            hide-details
            :disabled="
              queryParams.pollutants.length <= 1 &&
              queryParams.pollutants.includes(item.id)
            "
            @change="onChangeForm('pollutants', $event)"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1 d-flex align-center" cols="12">
          <label
            class="d-inline-flex"
            :class="{'text-decoration-line-through': disabledStations}"
            for="stations-switch"
          >
            {{ $t('stations') }}
          </label>

          <v-switch
            id="stations-switch"
            class="d-inline-flex ml-2 mt-0 pt-0"
            v-model="_isShowStations"
            :disabled="disabledStations || loading"
            color="primary"
            hide-details
            dense
          />
        </v-col>

        <v-col
          v-if="_isShowStations"
          class="pl-2"
          cols="12"
          :style="{opacity: disabledStations ? 0.5 : 1}"
        >
          <SelectBox
            class="mt-4"
            v-for="(group, cityId) of stationsGroupedByCity"
            tag-name="v-select"
            :key="cityId"
            :value="group.selected"
            :items="group.stations"
            :label="group.city.name"
            :disabled="disabledStations || loading"
            item-text="name"
            item-value="id"
            has-select-all
            has-deselect-all
            hide-details
            clearable
            multiple
            @input="onChangeStationsSelect(group, $event)"
            @blur="onBlurStationsSelect($event)"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('export') }}</v-col>

        <v-col class="d-flex justify-center" cols="12">
          <ExportBtn
            :value="'CSV'"
            :disabled="loading"
            @click="onClickExport"
          />
        </v-col>

        <!-- TODO: temporarily hidden -->
        <!-- <v-col class="d-flex justify-center mt-7" cols="12">
          <CopyQueryURLBtn :disabled="loading" @click="onClickCopyQueryURL" />
        </v-col> -->
      </v-row>
    </v-form>
  </PageDrawer>
</template>

<script lang="ts">
import _difference from 'lodash.difference'
import {mdiInformationOutline} from '@mdi/js'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import PageDrawer from '@/components/PageDrawer/PageDrawer.vue'
import SelectBox from '@/components/SelectBox.vue'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'
import CopyQueryURLBtn from '@/components/CopyQueryURLBtn.vue'
import RunningAverageEnum from '@/entities/RunningAverageEnum'
import Station from '@/entities/Station'
import City from '@/entities/City'
import ChartColsNum, {
  CHART_COLUMN_SIZES,
} from './MeasurementsChart/ChartColsNum'
import URLQuery, {URLQueryStations} from '../types/URLQuery'
import ChartDisplayModes from './MeasurementsChart/ChartDisplayModes'
import ChartData from './MeasurementsChart/ChartData'
import MeasurementsChart from './MeasurementsChart/MeasurementsChart.vue'

interface StationsNCityGroup {
  city: City
  stations: Station[]
  stationsIds: Station['id'][]
  selected: Station['id'][]
}

interface StationsNCitiesMap {
  [cityId: string]: StationsNCityGroup
}

@Component({
  components: {
    PageDrawer,
    SelectBox,
    ExportBtn,
    CopyQueryURLBtn,
  },
})
export default class MeasurementsRightDrawer extends Vue {
  @Prop({type: Boolean, default: false})
  readonly open!: boolean

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  @Prop({type: Boolean, default: false})
  readonly loading!: boolean

  @Prop({type: Boolean, default: false})
  readonly disabledStations!: boolean

  public forceShowStationsSelect: boolean = false
  public mdiInformationOutline = mdiInformationOutline

  public get displayMode(): ChartDisplayModes {
    return this.queryParams.display_mode || ChartDisplayModes.NORMAL
  }

  public get runningAverage(): RunningAverageEnum {
    return this.queryParams.running_average || RunningAverageEnum['1d']
  }

  public get chartCols(): number {
    const cols: ChartColsNum =
      this.queryParams.chart_cols ||
      MeasurementsChart.getMaxChartCols(
        this.$vuetify,
        this.queryParams.cities.length,
        this.queryParams.pollutants.length
      )
    return this.CHART_SIZE_LABELS.indexOf(cols)
  }

  public get _isShowStations(): boolean {
    if (
      this.queryParams.display_mode === ChartDisplayModes.SUPERIMPOSED_YEARS
    ) {
      return false
    }
    return this.forceShowStationsSelect || !!this.queryParams.stations?.length
  }
  public set _isShowStations(value: boolean) {
    let visibleStations: Station['id'][]

    if (value) {
      if (this.chartData.stations?.length) {
        visibleStations = this.chartData.stations.map((i) => i.id)
      } else {
        visibleStations = [URLQueryStations.all]
      }
    } else {
      visibleStations = []
    }

    this.forceShowStationsSelect = value
    this.onChangeForm('stations', visibleStations)
  }

  public get stationsGroupedByCity(): StationsNCitiesMap {
    const map: StationsNCitiesMap = {}

    for (const station of this.chartData.stations) {
      let city: City | undefined

      if (map[station.city_id]) {
        city = map[station.city_id]?.city
      } else {
        city = this.chartData.cities.find((i) => i.id === station.city_id)
        if (!city) continue
        map[station.city_id] = {
          city,
          stations: [],
          selected: [],
          stationsIds: [],
        }
      }
      map[station.city_id].stations.push(station)
      map[station.city_id].stationsIds.push(station.id)

      const isSelected = (this.queryParams.stations || []).includes(station.id)
      if (isSelected) map[station.city_id].selected.push(station.id)
    }

    return map
  }

  public get CHART_SIZE_VALUES(): {min: number; max: number} {
    const maxChartCols = MeasurementsChart.getMaxChartCols(
      this.$vuetify,
      this.queryParams.cities.length,
      this.queryParams.pollutants.length
    )
    const maxIndex = CHART_COLUMN_SIZES.indexOf(maxChartCols)
    return {
      min: 0,
      max: maxIndex <= 0 ? 1 : maxIndex,
    }
  }

  public get CHART_SIZE_LABELS(): ChartColsNum[] {
    return CHART_COLUMN_SIZES.slice()
  }

  public get RUNNING_AVERAGE_OPTIONS(): RunningAverageEnum[] {
    return Object.values(RunningAverageEnum)
  }

  public get DISPLAY_MODES(): any {
    return Object.values(ChartDisplayModes).reduce((memo: any[], val) => {
      memo.push({
        label: this.$t(val.toLowerCase() || '').toString(),
        value: val,
      })
      return memo
    }, [])
  }

  public created() {
    this.forceShowStationsSelect = !!this.queryParams?.stations?.length
  }

  @Emit('update:open')
  public toggle(value: boolean) {}

  @Emit('click:export')
  public onClickExport(fileType: ExportFileType, $event: MouseEvent) {}

  @Emit('click:copy_url')
  public onClickCopyQueryURL($event: MouseEvent) {}

  public onBlurStationsSelect($event: FocusEvent) {
    const isRealBlur = !$event.relatedTarget
    if (isRealBlur && !this.queryParams?.stations?.length) {
      this.forceShowStationsSelect = false
    }
  }

  public onChangeStationsSelect(
    group: StationsNCityGroup,
    newStationsIds: Station['id'][]
  ) {
    const idsToDelete = _difference(group.selected, newStationsIds)
    const idsToAdd = _difference(newStationsIds, group.selected)

    const visibleStations = (this.queryParams.stations || [])
      .slice()
      .filter((id) => !idsToDelete.includes(id))
    Array.prototype.push.apply(visibleStations, idsToAdd)

    this.onChangeForm('stations', visibleStations)
  }

  public onChangeForm(key: keyof URLQuery, value: any) {
    const queryParams = {
      ...this.queryParams,
      [key]: value,
    }
    setTimeout(() => this.$emit('update:queryParams', queryParams), 100)
  }
}
</script>

<style lang="scss"></style>
