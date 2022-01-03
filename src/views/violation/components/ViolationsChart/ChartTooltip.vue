<template>
  <v-card class="violations-chart-tooltip pb-2">
    <v-card-title
      v-if="title"
      class="text-body-1 font-weight-bold text-transform-none"
      v-text="title"
    />

    <v-card-subtitle
      v-if="subtitle"
      class="caption text-left text-transform-none pb-2"
      v-text="subtitle"
    />

    <v-card-text v-if="tableItems.length">
      <v-data-table
        :headers="tableHeaders"
        :items="tableItems"
        item-class="class"
        disable-filtering
        disable-pagination
        disable-sort
        hide-default-footer
        :items-per-page="-1"
      />
    </v-card-text>

    <div
      v-if="hasOvershoot"
      class="px-4 text-caption"
      :class="OVERSHOOT_VIOLATION_COLOR_CLASS"
      style="margin-bottom: -5px"
      v-text="hasOvershootEstimated
                ? '*' + $t('estimated_average_so_far_this_year').toString().toLowerCase()
                : '*' + $t('average_so_far_this_year').toString().toLowerCase()"
    />
  </v-card>
</template>

<script lang="ts">
import {Component, Vue, Prop} from 'vue-property-decorator'
import {OVERSHOOT_VIOLATION_COLOR_CLASS} from './ViolationsChart.vue'

@Component
export default class ChartTooltip extends Vue {
  @Prop({type: String})
  readonly title!: string

  @Prop({type: String})
  readonly subtitle!: string

  @Prop({type: Boolean, default: false})
  readonly hasOvershoot!: boolean

  @Prop({type: Boolean, default: false})
  readonly hasOvershootEstimated!: boolean

  @Prop({type: Array, default: () => []})
  readonly tableHeaders!: any[]

  @Prop({type: Array, default: () => []})
  readonly tableItems!: any[]

  public OVERSHOOT_VIOLATION_COLOR_CLASS = OVERSHOOT_VIOLATION_COLOR_CLASS
}
</script>

<style lang="scss">
.violations-chart-tooltip {
  width: max-content;
  min-width: fit-content;
  min-height: fit-content;
  max-width: 400px !important;
  max-height: 250px;
  display: flex !important;
  flex-direction: column;
  z-index: 11 !important;

  .v-card__text {
    flex-grow: 1;
    overflow: auto;

    .v-data-table {
      thead {
        tr {
          th {
            text-transform: none;
            height: fit-content !important;
            font-size: 12px !important;
            padding: 5px 5px !important;
          }
        }
      }

      tbody {
        tr {
          td {
            height: fit-content !important;
            padding: 2px 5px !important;
            font-size: 12px !important;
          }
        }
      }
    }
  }
}
</style>
