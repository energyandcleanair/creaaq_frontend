<template>
<div class="view-home">
  <h1 class="d-block text-center my-5">
    Home
  </h1>

  <v-container class="text-center">
    <RouterLink :to="{name: 'Measurements'}" v-text="$t('measurements')" />
  </v-container>
</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ViewHome extends Vue {
}
</script>

<style lang="scss">
</style>