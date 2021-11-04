<template>
  <v-card class="map-marker-popup" color="transparent" flat>
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

    <v-card-text>
      <template v-if="detailsList">
        <div class="text-body-2" v-for="(val, key) of detailsList" :key="key">
          <b>{{ key }}:</b> {{ val }}
        </div>
      </template>

      <v-btn
        class="mt-3"
        color="primary"
        block
        depressed
        dense
        @click="$emit('click:button')"
      >
        {{ $t('go_to_measurements') }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {Component, Vue, Prop} from 'vue-property-decorator'

@Component
export default class MapMarkerPopup extends Vue {
  @Prop({type: String})
  readonly title!: string

  @Prop({type: String})
  readonly subtitle!: string

  @Prop({type: Object})
  readonly detailsList!: any[]
}
</script>

<style lang="scss">
.map-marker-popup {
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
  }
}
</style>
