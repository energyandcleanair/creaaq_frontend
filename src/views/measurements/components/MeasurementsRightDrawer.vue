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

  <v-form class="drawer__form px-3">
    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('running_average') }}</v-col>

      <v-col class="d-flex justify-center" cols="12">
        <v-btn-toggle
          v-model="formData.runningAverage"
          color="primary"
          tile
          group
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
      <v-col class="subtitle-2" cols="12">{{ $t('chart_size') }}</v-col>

      <v-col class="d-flex justify-center" cols="12">
        <v-slider
          v-model="formData.chartSize"
          color="primary"
          :min="CHART_SIZE_OPTIONS.min"
          :max="CHART_SIZE_OPTIONS.max"
          step="20"
          ticks="always"
          tick-size="2"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('sources') }}</v-col>

      <v-col v-if="formData.sources.lenght" class="d-flex justify-center" cols="12">
        <v-radio-group
          v-model="formData.sources"
          color="primary"
        >
            <v-radio
              v-for="item of sources"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </v-radio-group>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('pollutants') }}</v-col>

      <v-col v-if="formData.pollutants.lenght" class="d-flex justify-center" cols="12">
        <v-checkbox
          v-for="item of pollutants"
          v-model="formData.pollutants[item.id]"
          color="primary"
          :key="item.id"
          :label="item.name"
          :value="item.id"
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
          v-model="formData.isShowStations"
          color="primary"
          hide-details
          dense
        />
      </v-col>

      <v-col v-if="formData.isShowStations" class="d-flex justify-center" cols="12">
        <v-select
        />
      </v-col>
    </v-row>
  </v-form>
</v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import { mdiClose, mdiTune } from '@mdi/js'
import Source from '@/entities/Source'
import Pollutant from '@/entities/Pollutant'

interface PropertiesForm {
  runningAverage: string
  chartSize: number
  sources: Source['id'][]
  pollutants: {
    [id: string]: boolean
  }
  isShowStations: boolean
  stationsDisplayOptions: any
}

enum RunningAverageEnum {
  '1d' = '1d',
  '7d' = '7d',
  '14d' = '14d',
  '1m' = '1m',
  '1Q' = '1Q',
  '1Y' = '1Y',
}

@Component
export default class MeasurementsRightDrawer extends Vue {
  @Prop({type: Boolean, default: false}) open!: boolean
  @Prop({type: Array, default: () => []}) sources!: Source[]
  @Prop({type: Array, default: () => []}) pollutants!: Pollutant[]
  private mdiClose = mdiClose
  private mdiTune = mdiTune

  private formData: PropertiesForm = {
    runningAverage: '',
    chartSize: 0,
    sources: [],
    pollutants: {},
    isShowStations: false,
    stationsDisplayOptions: '',
  }

  private get CHART_SIZE_OPTIONS (): {min: number, max: number} {
    return {
      min: -100,
      max: 100,
    }
  }

  private get RUNNING_AVERAGE_OPTIONS (): RunningAverageEnum[]{
    return Object.values(RunningAverageEnum)
  }

  @Emit('update:open')
  public toggle (value: boolean) {}
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
      margin-bottom: 1.5rem;
    }
  }
}
</style>