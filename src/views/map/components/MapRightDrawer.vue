<template>
  <PageDrawer
    :open="open"
    @input="toggle($event)"
  >
    <v-form>
      <v-row no-gutters>
        <v-col
          class="text-subtitle-1"
          cols="12"
        >{{ $t('level') }}</v-col>

        <v-col
          class="d-flex pl-1"
          cols="12"
        >
          <v-radio-group
            :value="queryLevel"
            hide-details
            @change="onChangeForm('level', $event)"
          >
            <v-radio
              v-for="item in LEVELS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </v-radio-group>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col
          class="text-subtitle-1"
          cols="12"
        >{{ $t('pollutants') }}</v-col>

        <v-col
          v-if="pollutants.length"
          class="pl-1"
          cols="12"
        >
          <v-checkbox
            v-for="item of pollutants"
            :input-value="queryParams.pollutants"
            :key="item.id"
            :value="item.id"
            :label="item.label"
            color="primary"
            hide-details
            :disabled="loading || (queryParams.pollutants.length <= 1
              && queryParams.pollutants.includes(item.id))
            "
            @change="onChangeForm('pollutants', $event)"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col
          class="text-subtitle-1"
          cols="12"
        >{{ $t('basemap') }}</v-col>

        <v-col
          class="d-flex pl-1"
          cols="12"
        >
          <v-radio-group
            :value="queryBasemap"
            disabled
            hide-details
            @change="onChangeForm('basemap', $event)"
          >
            <v-radio
              v-for="item in BASEMAPS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </v-radio-group>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col
          class="text-subtitle-1"
          cols="12"
        >{{ $t('export') }}</v-col>

        <v-col
          class="d-flex justify-center"
          cols="12"
        >
          <ExportBtn
            :value="'CSV'"
            @click="onClickExport"
          />
        </v-col>
      </v-row>
    </v-form>
  </PageDrawer>
</template>

<script lang="ts">
import _difference from 'lodash.difference'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
// import {toURLStringDate} from '@/utils'
import PageDrawer from '@/components/PageDrawer.vue'
import Pollutant from '@/entities/Pollutant'
import URLQuery, {MapChartBasemap, MapChartLevel} from '../types/URLQuery'
import ChartData from './MapChart/MapChartData'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'

@Component({
  components: {
    PageDrawer,
    ExportBtn,
  },
})
export default class MapRightDrawer extends Vue {
  @Prop({type: Boolean, default: false})
  readonly open!: boolean

  @Prop({type: Boolean, default: false})
  readonly loading!: boolean

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  private get LEVELS(): {label: string; value: string}[] {
    return Object.values(MapChartLevel).map((item) => ({
      label: this.$t(item).toString(),
      value: item,
    }))
  }

  private get BASEMAPS(): {label: string; value: string}[] {
    return Object.values(MapChartBasemap).map((item) => ({
      label: this.$t(item).toString(),
      value: item,
    }))
  }

  private get queryLevel(): MapChartLevel {
    return this.queryParams.level || MapChartLevel.city
  }

  private get queryPollutantsMap(): Record<Pollutant['id'], number> {
    return (this.queryParams?.pollutants || []).reduce(
      (memo: Record<Pollutant['id'], number>, id) => {
        memo[id] = 1
        return memo
      },
      {}
    )
  }

  private get queryBasemap(): MapChartBasemap {
    return this.queryParams.basemap || MapChartBasemap.satellite
  }

  private get pollutants(): Pollutant[] {
    return this.chartData.pollutants || []
  }

  @Emit('update:open')
  public toggle(value: boolean) {}

  @Emit('click:export')
  public onClickExport(fileType: ExportFileType, $event: MouseEvent) {}

  public onChangeFiltersForm(newParams: any) {
    const queryParams = {
      ...this.queryParams,
      ...newParams,
    }
    this.emitChange(queryParams)
  }

  public onChangeForm(key: keyof URLQuery, value: any) {
    const queryParams = {
      ...this.queryParams,
      [key]: value,
    }
    this.emitChange(queryParams)
  }

  public emitChange(queryParams: URLQuery) {
    this.$emit('update:queryParams', queryParams)
  }
}
</script>
