<template>
<v-navigation-drawer
  class="measurements-right-drawer"
  :value="open"
  app
  clipped
  right
  width="230"
  mobile-breakpoint="960"
>

  <template v-slot:prepend>
    <v-btn
      class="drawer-handler"
      :title="$t('display_parameters')"
      :style="{'margin-top': $vuetify.application.top + 'px'}"
      color="primary"
      icon
      @click="toggle(!open)"
    >
      <v-icon>{{ mdiTune }}</v-icon>
    </v-btn>

    <v-toolbar height="40" flat>
      <v-spacer/>

      <v-btn icon small @click="toggle(!open)">
        <v-icon small>{{ mdiClose }}</v-icon>
      </v-btn>
    </v-toolbar>
  </template>

  <v-form class="drawer__form px-3 pb-10">
    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('display_mode') }}</v-col>

      <v-col class="d-flex justify-center" cols="12">
        <v-select
          class="mt-0 pt-2"
          :value="formData.displayMode"
          :items="DISPLAY_MODES"
          item-text="label"
          item-value="value"
          hide-details
          @change="onChangeForm('displayMode', $event)"
        />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('running_average') }}</v-col>

      <v-col class="d-flex justify-center mt-2" cols="12">
        <v-btn-toggle
          :value="formData.runningAverage"
          color="primary"
          tile
          group
          @change="onChangeForm('runningAverage', $event)"
        >
          <v-btn
            class="px-1"
            v-for="val of RUNNING_AVERAGE_OPTIONS"
            :key="val"
            :value="val"
            v-text="val"
            small
            style="text-transform: none;"
          />
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('chart_columns') }}</v-col>

      <v-col class="d-flex justify-center mt-2" cols="12">
        <v-slider
          :value="CHART_SIZE_LABELS.indexOf(formData.chartColumnSize)"
          color="primary"
          :min="CHART_SIZE_VALUES.min"
          :max="CHART_SIZE_VALUES.max"
          step="1"
          ticks="always"
          tick-size="2"
          hide-details
          thumb-label
          :thumb-size="18"
          @change="onChangeForm('chartColumnSize', CHART_SIZE_LABELS[$event])"
        >
          <template v-slot:thumb-label="{ value }">
            {{ CHART_SIZE_LABELS[value] }}
          </template>
        </v-slider>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('sources') }}</v-col>

      <v-col v-if="formData.sources.length" class="d-flex pl-1" cols="12">
        <v-radio-group
          :value="formData.visibleSources && formData.visibleSources[0]"
          color="primary"
          hide-details
          @change="onChangeForm('visibleSources', [$event])"
        >
            <v-radio
              v-for="item of formData.sources"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </v-radio-group>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('pollutants') }}</v-col>

      <!-- TODO: complete -->
      <v-col v-if="pollutantsCheckboxes.length" class="pl-1" cols="12">
          <!-- :value="item.checked" -->
        <v-checkbox
          v-for="item of pollutantsCheckboxes"
          v-model="item.id"
          :key="item.id"
          color="primary"
          :label="item.label"
          hide-details
          disabled
          @change="onChangeForm(
            'visiblePollutants',
            $event
              ? formData.visiblePollutants.filter(itm => itm !== item.id)
              : [...formData.visiblePollutants, item.id]
          )"
        />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2 d-flex align-center" cols="12">
        <label class="d-inline-flex" for="stations-switch">
          {{ $t('stations') }}
        </label>

        <v-switch
          id="stations-switch"
          class="d-inline-flex ml-2 mt-0 pt-0"
          :value="formData.isShowStations"
          color="primary"
          hide-details
          dense
          @change="onChangeForm('isShowStations', $event)"
        />
      </v-col>

      <v-col v-if="formData.isShowStations" class="d-flex justify-center" cols="12">
        <v-select
          @change="onChangeForm('stations', $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import { mdiClose, mdiTune } from '@mdi/js'
import PagePropertiesForm from '../types/PagePropertiesForm'
import RunningAverageEnum from '../types/RunningAverageEnum'
import ChartColumnSize, { CHART_COLUMN_SIZES } from '../types/ChartColumnSize'
import ChartDisplayModes from './MeasurementsChart/ChartDisplayModes'

@Component
export default class MeasurementsRightDrawer extends Vue {
  @Prop({type: Object, required: true}) formData!: PagePropertiesForm
  @Prop({type: Boolean, default: false}) open!: boolean
  private mdiClose = mdiClose
  private mdiTune = mdiTune

  // TODO: complete
  private get pollutantsCheckboxes (): any {
    return this.formData.pollutants.map((pollutant) => ({
      id: pollutant.id,
      label: pollutant.label,
      checked: this.formData.visiblePollutants.includes(pollutant.id),
    }))
  }
  private get CHART_SIZE_VALUES (): {min: number, max: number} {
    return {
      min: 0,
      max: CHART_COLUMN_SIZES.length - 1,
    }
  }
  private get CHART_SIZE_LABELS (): ChartColumnSize[] {
    return CHART_COLUMN_SIZES.slice()
  }

  private get RUNNING_AVERAGE_OPTIONS (): RunningAverageEnum[]{
    return Object.values(RunningAverageEnum)
  }

  private get DISPLAY_MODES (): any {
    return Object.values(ChartDisplayModes)
      .reduce((memo: any[], val) => {
        memo.push({
          label: this.$t(val.toLowerCase() || '').toString(),
          value: val,
        })
        return memo
      }, [])
  }

  @Emit('update:open')
  public toggle (value: boolean) {}

  public onChangeForm (key: keyof PagePropertiesForm, value: any) {
    const formData = {
      ...this.formData,
      [key]: value
    }
    setTimeout(() => this.$emit('update:formData', formData), 100)
  }
}
</script>

<style lang="scss">
.measurements-right-drawer {
  overflow: visible;

  &.v-navigation-drawer--close {
    visibility: visible !important;

    .v-navigation-drawer__content,
    .v-navigation-drawer__border {
      visibility: hidden !important;
    }
  }

  .v-navigation-drawer__prepend {
    position: relative;

    .drawer-handler {
      position: absolute;
      left: -2.7rem;
      top: .5rem;
      width: 2.7rem;
      height: 2rem;
      z-index: 10;
      border-radius: 0.2rem;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &.v-navigation-drawer--open {
    .drawer-handler {
      display: none;
    }
  }

  &:not(.v-navigation-drawer--is-mobile) {
    .drawer-handler {
      margin-top: 0 !important;
    }
  }

  .drawer__form {
    overflow: auto;

    > .row {
      margin-bottom: 2rem;
    }
  }
}
</style>