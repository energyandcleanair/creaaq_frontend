<template>
  <PageDrawer :open="open" @input="toggle($event)">
    <v-form>
      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('year') }}</v-col>

        <v-col class="d-flex justify-center" cols="12">
          <v-select
            class="mt-0 pt-2"
            :value="queryParams.date_start"
            :items="YEARS"
            :disabled="loading"
            item-text="label"
            item-value="value"
            hide-details
            @change="onChangeForm('date_start', $event)"
          />
        </v-col>
      </v-row>

      <v-row class="mb-0" no-gutters>
        <ViolationsFiltersForm
          :value-guidelines="queryParams.guidelines"
          :value-pollutants="queryParams.pollutants"
          :value-targets="queryParams.targets"
          filter-primary="guidelines"
          filter-secondary="pollutants/targets"
          :guidelines="guidelines"
          :pollutants="pollutants"
          :targets="targets"
          :disabled="loading"
          @change="onChangeFiltersForm"
        />
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1 d-flex align-center" cols="12">
          <label class="d-inline-flex" for="overshooting-switch">
            <v-tooltip max-width="400" bottom>
              <template v-slot:activator="{on, attrs}">
                {{ $t('overshooting') }}
                <v-icon
                  class="ml-1"
                  color="grey lighten-2"
                  small
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ mdiInformationOutline }}
                </v-icon>
              </template>
              <span v-html="$t('msg.overshooting_tooltip_info')" />
            </v-tooltip>
          </label>

          <v-switch
            id="overshooting-switch"
            class="d-inline-flex ml-2 mt-0 pt-0"
            v-model="_isOvershooting"
            :disabled="loading"
            :color="OVERSHOOT_VIOLATION_COLOR"
            hide-details
            dense
          />
        </v-col>
      </v-row>
    </v-form>
  </PageDrawer>
</template>

<script lang="ts">
import moment from 'moment'
import _difference from 'lodash.difference'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import {mdiInformationOutline} from '@mdi/js'
import {toURLStringDate} from '@/utils'
import PageDrawer from '@/components/PageDrawer.vue'
import Guideline from '@/entities/Guideline'
import Pollutant from '@/entities/Pollutant'
import Target from '@/entities/Target'
import URLQuery from '../types/URLQuery'
import ChartData from './ViolationsChart/ChartData'
import ViolationsFiltersForm from './ViolationsFiltersForm.vue'
import {OVERSHOOT_VIOLATION_COLOR} from './ViolationsChart/ViolationsChart.vue'

@Component({
  components: {
    PageDrawer,
    ViolationsFiltersForm,
  },
})
export default class ViolationsRightDrawer extends Vue {
  @Prop({type: Boolean, default: false})
  readonly open!: boolean

  @Prop({type: Boolean, default: false})
  readonly loading!: boolean

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  public mdiInformationOutline = mdiInformationOutline
  public OVERSHOOT_VIOLATION_COLOR = OVERSHOOT_VIOLATION_COLOR

  public get YEARS(): {label: string; value: string}[] {
    const years: {label: string; value: string}[] = []
    let year = moment().year()

    while (year >= 1920) {
      const date = moment(0).year(year)
      years.push({
        label: date.year().toString(),
        value: toURLStringDate(+date),
      })
      year--
    }

    return years
  }

  public get _isOvershooting(): boolean {
    return this.queryParams.overshooting || false
  }
  public set _isOvershooting(value: boolean) {
    this.onChangeForm('overshooting', value)
  }

  public get pollutants(): Pollutant[] {
    return this.chartData.pollutants || []
  }

  public get guidelines(): Guideline[] {
    return this.chartData.guidelines || []
  }

  public get targets(): Target[] {
    return this.chartData.targets || []
  }

  @Emit('update:open')
  public toggle(value: boolean) {}

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
