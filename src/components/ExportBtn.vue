<template>
  <v-sheet class="export-btn">
    <v-select
      class="mt-0 pt-2"
      v-model="value"
      :items="fileTypes"
      :disabled="$props.disabled"
      hide-details
    >
      <template v-slot:append-outer>
        <v-btn v-bind="$props" outlined small @click="onClick(value, $event)">
          <v-icon left>{{ mdiFileDownloadOutline }}</v-icon>
          {{ $t('export') }}
        </v-btn>
      </template>
    </v-select>
  </v-sheet>
</template>

<script lang="ts">
import {mdiFileDownloadOutline} from '@mdi/js'
import {Component, Emit, Model} from 'vue-property-decorator'
import {VBtn} from 'vuetify/lib'

export enum ExportFileType {
  CSV = 'CSV',
}

@Component({
  components: {
    VBtn,
  },
})
export default class ExportBtn extends VBtn {
  @Model('input', {type: String})
  readonly value!: string

  public mdiFileDownloadOutline = mdiFileDownloadOutline

  public get fileTypes(): string[] {
    return Object.keys(ExportFileType)
  }

  @Emit('click')
  public onClick(fileType: string, $event: MouseEvent) {}
}
</script>

<style lang="scss">
.export-btn {
  .v-input__control {
    max-width: 70px;
  }
}
</style>
