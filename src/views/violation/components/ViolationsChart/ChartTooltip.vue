<template>
<v-card
  class="violations-chart-tooltip pb-2"
>
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
    >

    </v-data-table>
  </v-card-text>

  <div class="tooltip-arrow"></div>
</v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class ChartTooltip extends Vue {

  @Prop({type: HTMLElement, required: false})
  readonly activator!: HTMLElement

  @Prop({type: String})
  readonly title!: string

  @Prop({type: String})
  readonly subtitle!: string

  @Prop({type: Array, default: () => []})
  readonly tableHeaders!: any[]

  @Prop({type: Array, default: () => []})
  readonly tableItems!: any[]
}
</script>

<style lang="scss">
.violations-chart-tooltip {
  width: max-content;
  min-width: fit-content;
  min-height: fit-content;
  max-width: 350px !important;
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
            font-size: 11px !important;
            padding: 5px 5px !important;
          }
        }
      }

      tbody {
        tr {
          td {
            height: fit-content !important;
            padding: 2px 5px !important;
            font-size: 11px !important;

            &:nth-child(2),
            &:nth-child(4) {
              color: var(--v-grey-darken1) !important;
            }
          }
        }
      }
    }
  }

  .tooltip-arrow {
    width: 16px;
    height: 16px;
    color: #fff;
    position: absolute;

    &:before {
      content: '';
      position: absolute;
      border-color: transparent;
      border-style: solid;
    }
  }

  &[data-popper-placement^=top] > .tooltip-arrow {
    bottom: 0;
    left: calc(50% - 8px);

    &:before {
      bottom: -7px;
      left: 0;
      border-width: 8px 8px 0;
      border-top-color: initial;
      transform-origin: center top;
      filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));
    }
  }

  &[data-popper-placement^=bottom] > .tooltip-arrow {
    top: 0;
    left: calc(50% - 8px);

    &:before {
      top: -7px;
      left: 0;
      border-width: 0 8px 8px;
      border-bottom-color: initial;
      transform-origin: center bottom;
      filter: drop-shadow(0 -1px 1px rgba(0,0,0,0.1));
    }
  }
}
</style>