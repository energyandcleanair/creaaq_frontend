<template>
<div class="view-measurements">
  <h1 class="d-block text-center my-5">
    Measurements
  </h1>

  <v-container class="text-center">
    {{ $tc('msg.will_be_added_soon') }}
  </v-container>
</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ViewMeasurements extends Vue {}
</script>

<style lang="scss">
.view-measurements {}
</style>