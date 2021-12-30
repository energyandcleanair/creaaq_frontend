<template>
  <v-dialog
    content-class="regulation-details-modal"
    :value="value"
    scrollable
    width="500"
    @input="$emit('input', $event)"
  >
    <v-card v-if="regulation" class="pb-2">
      <v-card-title class="d-flex flex-column align-start pb-2">
        <div class="text-caption grey--text" v-text="$t('regulation')" />
        <div
          class="text-h6 font-weight-bold text-transform-none"
          v-text="regulation.name"
        />
      </v-card-title>

      <v-card-text class="pt-2">
        <div
          v-if="regulation.link"
          class="text-body-1 text-left text-transform-none mt-0 pb-3"
        >
          <v-icon class="mr-1" color="primary" small>
            {{ mdiWeb }}
          </v-icon>
          <a :href="regulation.link" v-text="regulation.link" target="_blank" />
        </div>

        <div v-if="countries.length" class="text-body-1">
          <span class="font-weight-bold pr-2" v-text="$t('regions') + ':'" />
          <span v-text="countries.map(({name}) => name).join(', ')" />
        </div>

        <div
          class="font-weight-bold text-body-1 mt-3 mb-2"
          v-text="$t('targets')"
        />
        <v-data-table
          :headers="targetsTableHeaders"
          :items="targets"
          disable-filtering
          disable-pagination
          disable-sort
          hide-default-footer
          :items-per-page="-1"
        >
          <template v-slot:item.exceptions_allowed="{value}">
            {{ value ? value : '-' }}
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" outlined @click="$emit('input', false)">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {Component, Vue, Prop, Model} from 'vue-property-decorator'
import {mdiWeb} from '@mdi/js'
import Regulation from '@/entities/Regulation'
import Country from '@/entities/Country'
import Target from '@/entities/Target'

@Component
export default class RegulationDetailsModal extends Vue {
  @Model('input', {type: Boolean})
  readonly value!: any[]

  @Prop({type: Object, required: false})
  readonly regulation?: Regulation | null

  @Prop({type: Array, required: true})
  readonly countries!: Country[]

  @Prop({type: Array, required: true})
  readonly targets!: Target[]

  public mdiWeb = mdiWeb

  public get targetsTableHeaders() {
    return [
      {
        text: this.$t('pollutant'),
        value: 'pollutant_name',
        align: 'start',
        cellClass: 'primary--text font-weight-bold',
      },
      {
        text: this.$t('period'),
        value: 'averaging_period_name',
        align: 'center',
        cellClass: 'primary--text',
      },
      {
        text: this.$t('value'),
        value: 'target_value',
        align: 'center',
        cellClass: 'primary--text',
      },
      {
        text: this.$t('unit'),
        value: 'target_unit',
        align: 'center',
        cellClass: 'primary--text',
      },
      {
        text: this.$t('exceptions_allowed'),
        value: 'exceptions_allowed',
        align: 'center',
        cellClass: 'primary--text',
      },
    ]
  }
}
</script>

<style lang="scss">
.regulation-details-modal {
  .v-card__text {
    flex-grow: 1;
    overflow: auto;

    .v-data-table {
      thead {
        tr {
          th {
            text-transform: none;
            height: fit-content !important;
            font-size: 13px !important;
            padding: 0 5px 5px 5px !important;
          }
        }
      }

      tbody {
        tr {
          td {
            height: fit-content !important;
            padding: 2px 5px !important;
            font-size: 13px !important;
          }
        }
      }
    }
  }
}
</style>
