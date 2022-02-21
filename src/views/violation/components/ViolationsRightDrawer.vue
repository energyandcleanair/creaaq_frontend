<template>
  <PageDrawer :open="open" :show-open-button="false" @input="toggle($event)">
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
          :value-regulations="queryParams.regulations"
          :value-pollutants="queryParams.pollutants"
          :value-targets="queryParams.targets"
          filter-primary="regulations"
          filter-secondary="pollutants/targets"
          :regulations="regulations"
          :pollutants="pollutants"
          :targets="targets"
          :disabled="loading"
          @change="onChangeFiltersForm"
          @click:item-details="onClickDetails"
        />
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1" cols="12">{{ $t('sources') }}</v-col>

        <v-col v-if="chartData.usedSources.length" class="pl-1" cols="12">
          <v-checkbox
            v-for="item of chartData.usedSources"
            :input-value="queryParams.sources"
            :key="item.id"
            :value="item.id"
            color="primary"
            hide-details
            :disabled="
              queryParams.sources.length <= 1 &&
              queryParams.sources.includes(item.id)
            "
            @change="onChangeForm('sources', $event)"
          >
            <template v-slot:label>
              <v-menu bottom open-on-hover>
                <template v-slot:activator="{on, attrs}">
                  {{ item.name }}
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
          </v-checkbox>
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col class="text-subtitle-1 d-flex align-center" cols="12">
          <label class="d-inline-flex" for="overshooting-switch">
            <v-tooltip max-width="400" bottom>
              <template v-slot:activator="{on, attrs}">
                {{ $t('overshooting') }}
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
            @click="onClickOvershootingSwitch"
          />
        </v-col>
      </v-row>

      <!-- TODO: temporarily hidden -->
      <!-- <v-row no-gutters>
        <v-col class="d-flex justify-center mt-2" cols="12">
          <CopyQueryURLBtn :disabled="loading" @click="onClickCopyQueryURL" />
        </v-col>
      </v-row> -->
    </v-form>

    <RegulationDetailsModal
      v-model="regulationModal.open"
      :regulation="regulationModal.regulation"
      :countries="regulationModal.countries"
      :targets="regulationModal.targets"
    />
  </PageDrawer>
</template>

<script lang="ts">
import moment from 'moment'
import _difference from 'lodash.difference'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import {mdiInformationOutline} from '@mdi/js'
import {toURLStringDate} from '@/utils'
import PageDrawer from '@/components/PageDrawer/PageDrawer.vue'
import CopyQueryURLBtn from '@/components/CopyQueryURLBtn.vue'
import Regulation from '@/entities/Regulation'
import Pollutant from '@/entities/Pollutant'
import Country from '@/entities/Country'
import Target from '@/entities/Target'
import URLQuery from '../types/URLQuery'
import ChartData from './ViolationsChart/ChartData'
import ViolationsFiltersForm, {
  ViolationsPrimaryFilter,
} from './ViolationsFiltersForm.vue'
import {OVERSHOOT_VIOLATION_COLOR} from './ViolationsChart/ViolationsChart.vue'
import RegulationDetailsModal from './RegulationDetailsModal.vue'

@Component({
  components: {
    PageDrawer,
    ViolationsFiltersForm,
    RegulationDetailsModal,
    CopyQueryURLBtn,
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

  public regulationModal: {
    open: boolean
    regulation: Regulation | null
    countries: Country[]
    targets: Target[]
  } = {
    open: false,
    regulation: null,
    countries: [],
    targets: [],
  }
  public mdiInformationOutline = mdiInformationOutline
  public OVERSHOOT_VIOLATION_COLOR = OVERSHOOT_VIOLATION_COLOR

  public get YEARS(): {label: string; value: string}[] {
    const years: {label: string; value: string}[] = []
    let year = moment().year()

    while (year >= 1920) {
      const date = moment.utc(0).year(year)
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

  public get regulations(): Regulation[] {
    return this.chartData.regulations || []
  }

  public get targets(): Target[] {
    return this.chartData.targets || []
  }

  @Emit('update:open')
  public toggle(value: boolean) {}

  public onChangeFiltersForm(
    newParams: Pick<URLQuery, 'regulations' | 'pollutants' | 'targets'>
  ) {
    const queryParams: URLQuery = {
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

  public onClickOvershootingSwitch() {
    this.$nextTick(() => {
      if (this._isOvershooting === true) {
        this.$trackGtmEvent('violations', 'enable_overshooting')
      } else {
        this.$trackGtmEvent('violations', 'disable_overshooting')
      }
    })
  }

  public onClickDetails(type: ViolationsPrimaryFilter, item: Regulation) {
    if (type === ViolationsPrimaryFilter.regulations) {
      this.regulationModal.open = true
      this.regulationModal.regulation = item
      this.regulationModal.targets = this.chartData.targets.filter(
        (target) => target.regulation_id === item.id
      )
      this.regulationModal.countries = (item.country || []).reduce(
        (arr: Country[], countryId: Country['id']) => {
          const country = this.chartData.countriesMap.get(countryId)
          if (country) arr.push(country)
          return arr
        },
        []
      )
    }
  }

  public emitChange(queryParams: URLQuery) {
    this.$emit('update:queryParams', queryParams)
  }

  @Emit('click:copy_url')
  public onClickCopyQueryURL($event: MouseEvent) {}
}
</script>
