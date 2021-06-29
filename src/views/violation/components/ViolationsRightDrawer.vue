<template>
<PageDrawer
  :open="open"
  @input="toggle($event)"
>
  <v-form>
    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('year') }}</v-col>

      <v-col class="d-flex justify-center" cols="12">
        <v-select
          class="mt-0 pt-2"
          :value="queryParams.date_start"
          :items="YEARS"
          item-text="label"
          item-value="value"
          hide-details
          @change="onChangeForm('date_start', $event)"
        />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('organizations') }}</v-col>

      <v-col v-if="organizations.length" class="pl-1" cols="12">
        <v-checkbox
          v-for="item of organizations"
          :input-value="queryParams.organizations"
          :key="item.id"
          :value="item.id"
          :label="item.name"
          color="primary"
          hide-details
          :disabled="queryParams.organizations.length <= 1
            && queryParams.organizations.includes(item.id)
          "
          @change="onChangeForm('organizations', $event)"
        />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('pollutants') }}</v-col>

      <v-col v-if="pollutants.length" class="pl-1" cols="12">
        <v-checkbox
          v-for="item of pollutants"
          :input-value="queryParams.pollutants"
          :key="item.id"
          :value="item.id"
          :label="item.label"
          color="primary"
          hide-details
          :disabled="queryParams.pollutants.length <= 1
            && queryParams.pollutants.includes(item.id)
          "
          @change="onChangeForm('pollutants', $event)"
        />
      </v-col>
    </v-row>

    <div class="d-flex flex-row align-center my-6">
      <v-divider class="d-inline-flex grey lighten-2"/>
      <span class="d-inline-flex px-2 black--text">{{ $t('or') }}</span>
      <v-divider class="d-inline-flex grey lighten-2"/>
    </div>

    <v-row no-gutters>
      <v-col class="subtitle-2" cols="12">{{ $t('targets') }}</v-col>

      <v-col v-if="targets.length" class="pl-1" cols="12">
        <v-checkbox
          v-for="item of targets"
          :input-value="queryParams.targets"
          :key="item.id"
          :value="item.id"
          :label="item.short_name"
          color="primary"
          hide-details
          @change="onChangeForm('targets', $event)"
        />
      </v-col>
    </v-row>
  </v-form>
</PageDrawer>
</template>

<script lang="ts">
import _difference from 'lodash.difference'
import moment from 'moment'
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import { toURLStringDate } from '@/utils'
import PageDrawer from '@/components/PageDrawer.vue'
import Pollutant from '@/entities/Pollutant'
import Organization from '@/entities/Organization'
import Target from '@/entities/Target'
import URLQuery from '../types/URLQuery'
import ChartData from './ViolationsChart/ChartData'

@Component({
  components: {
    PageDrawer,
  }
})
export default class ViolationsRightDrawer extends Vue {

  @Prop({type: Boolean, default: false})
  readonly open!: boolean

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  private get YEARS (): {label: string, value: string}[] {
    const years: {label: string, value: string}[] = []
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

  private get pollutants (): Pollutant[] {
    return this.chartData.pollutants || []
  }

  private get organizations (): Organization[] {
    return this.chartData.organizations || []
  }

  private get targets (): Target[] {
    return this.chartData.targets || []
  }

  @Emit('update:open')
  public toggle (value: boolean) {}

  public onChangeForm (key: keyof URLQuery, value: any) {
    const queryParams = {
      ...this.queryParams,
      [key]: value
    }
    setTimeout(() => this.$emit('update:queryParams', queryParams), 100)
  }
}
</script>
