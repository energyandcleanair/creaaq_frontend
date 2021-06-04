<template>
<v-container class="view-settings" fluid>
  <h1 class="d-block text-center my-5">
    Settings
  </h1>

  <v-container class="mt-5">
    <v-btn
      color="primary"
      :loading="isLoading"
      @click="clearCache"
    >
      {{ $t('clear_cache') }}
    </v-btn>
  </v-container>
</v-container>
</template>

<script lang="ts">
import { forageStore } from '@/api/API'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ViewSettings extends Vue {
  private isLoading: boolean = false

  private clearCache () {
    this.isLoading = true
    forageStore.clear()
    setTimeout(() => this.isLoading = false, 1000)
  }
}
</script>

<style lang="scss">
</style>