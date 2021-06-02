<template>
<div class="view-settings">
  <h1 class="d-block text-center my-5">
    Settings
  </h1>

  <p class="text-center">
    {{ $tc('msg.will_be_added_soon') }}
  </p>
</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ViewSettings extends Vue {
}
</script>

<style lang="scss">
</style>