<template>
  <PageDrawer :open="open" @input="toggle($event)">
    <v-form>
      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('level') }}</v-col>

        <v-col class="d-flex pl-1" cols="12">
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

      <v-row v-if="queryLevel === 'station'" no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('sources') }}</v-col>

        <v-col v-if="chartData.sources.length" class="d-flex pl-1" cols="12">
          <SelectBox
            class="mt-0"
            :value="queryParams.sources"
            :items="chartData.sources"
            :disabled="loading"
            item-text="name"
            item-value="id"
            has-select-all
            has-deselect-all
            hide-details
            clearable
            multiple
            @input="onChangeForm('sources', $event)"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('pollutants') }}</v-col>

        <v-col v-if="pollutants.length" class="pl-1" cols="12">
          <SelectBox
            class="mt-0"
            :value="queryParams.pollutants"
            :items="pollutants"
            :disabled="loading"
            item-text="name"
            item-value="id"
            has-select-all
            has-deselect-all
            hide-details
            clearable
            multiple
            @input="onChangeForm('pollutants', $event)"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('basemap') }}</v-col>

        <v-col class="d-flex pl-1" cols="12">
          <v-radio-group
            :value="queryBasemap"
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

      <!-- TODO: not in use -->
      <!-- <v-row no-gutters>
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
      </v-row> -->

      <!-- TODO: temporarily hidden -->
      <!-- <v-row no-gutters>
        <v-col class="d-flex justify-center mt-2" cols="12">
          <CopyQueryURLBtn :disabled="loading" @click="onClickCopyQueryURL" />
        </v-col>
      </v-row> -->
    </v-form>
  </PageDrawer>
</template>

<script lang="ts">
import _difference from 'lodash.difference'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import PageDrawer from '@/components/PageDrawer/PageDrawer.vue'
import CopyQueryURLBtn from '@/components/CopyQueryURLBtn.vue'
import SelectBox from '@/components/SelectBox.vue'
import Pollutant from '@/entities/Pollutant'
import URLQuery, {MapChartBasemap, MapChartLevel} from '../types/URLQuery'
import ChartData from './MapChart/MapChartData'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'

@Component({
  components: {
    PageDrawer,
    ExportBtn,
    SelectBox,
    CopyQueryURLBtn,
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

  public get LEVELS(): {label: string; value: string}[] {
    return Object.values(MapChartLevel).map((item) => ({
      label: this.$t(item).toString(),
      value: item,
    }))
  }

  public get BASEMAPS(): {label: string; value: string}[] {
    return Object.values(MapChartBasemap).map((item) => ({
      label: this.$t(item).toString(),
      value: item,
    }))
  }

  public get queryLevel(): MapChartLevel {
    return this.queryParams.level || MapChartLevel.city
  }

  public get queryPollutantsMap(): Record<Pollutant['id'], number> {
    return (this.queryParams?.pollutants || []).reduce(
      (memo: Record<Pollutant['id'], number>, id) => {
        memo[id] = 1
        return memo
      },
      {}
    )
  }

  public get queryBasemap(): MapChartBasemap {
    return this.queryParams.basemap || MapChartBasemap.satellite
  }

  public get pollutants(): Pollutant[] {
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

  @Emit('click:copy_url')
  public onClickCopyQueryURL($event: MouseEvent) {}
}
</script>
