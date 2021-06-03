<template>
<v-container fluid>
  Measurements: {{ measurements }}
</v-container>
</template>

<script lang="ts">
import to from 'await-to-js'
import { Component, Vue, Prop } from 'vue-property-decorator'
import MeasurementAPI from '@/api/MeasurementAPI'
import Measurement from '@/entities/Measurement'
import MeasurementsQuery from './MeasurementsQuery'

@Component
export default class MeasurementsChart extends Vue {
  @Prop() readonly query!: MeasurementsQuery
  private measurements: Measurement[] = []
  private isLoading: boolean = false

  private mounted () {
    this.fetch()
  }

  private async fetch () {
    this.isLoading = true
    const measurements = await this.fetchMeasurements(this.query)
    this.measurements = measurements
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
}
</script>
