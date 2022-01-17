<template>
  <v-btn
    class="copy-query-url-btn"
    v-bind="$props"
    outlined
    small
    @click="onClick($event)"
  >
    <v-icon left>{{ mdiContentCopy }}</v-icon>
    {{ $t('copy_query_url') }}
  </v-btn>
</template>

<script lang="ts">
import {mdiContentCopy} from '@mdi/js'
import {Component, Emit} from 'vue-property-decorator'
import {VBtn} from 'vuetify/lib'

@Component({
  components: {
    VBtn,
  },
})
export default class CopyQueryURLBtn extends VBtn {
  public readonly mdiContentCopy = mdiContentCopy

  @Emit('click')
  public onClick($event: MouseEvent) {}
}
</script>

<style lang="scss">
// .export-btn {
//   .v-input__control {
//     max-width: 70px;
//   }
// }
</style>
