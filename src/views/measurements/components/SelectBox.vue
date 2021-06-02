<template>
<v-autocomplete
  chips
  multiple
  clearable
  attached
  v-bind="$props"
  v-on="$listeners"
>
  <template v-slot:selection="{ item, index }">
    <v-chip v-if="index <= 0">
      <span>
        {{
          typeof $props.itemText === 'function'
            ? $props.itemText(item)
            : item[$props.itemText || 'name']
        }}
      </span>
    </v-chip>
    <span
      v-if="index === 1"
      class="grey--text text-caption"
    >
      (+{{ value.length - 1 }})
    </span>
  </template>

  <template v-if="items.length" v-slot:prepend-item>
    <v-list-item ripple @click="toggleSelected">
      <v-list-item-action>
        <v-icon :color="isSelectedSome ? 'indigo darken-4' : ''">
          {{
            isSelectedAll
              ? mdiCloseBox
              : isSelectedSome
                ? mdiMinusBox
                : mdiCheckboxBlankOutline
          }}
        </v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          {{ isSelectedAll ? $t('deselect_all') : $t('select_all') }} ({{ items.length }})
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider class="mt-2"></v-divider>
  </template>
</v-autocomplete>
</template>

<script lang="ts">
import { mdiCloseBox, mdiMinusBox, mdiCheckboxBlankOutline } from '@mdi/js'
import { Component, Model, Prop } from 'vue-property-decorator'
import { VSelect } from 'vuetify/lib'

@Component
export default class SelectBox extends VSelect {
  @Model('input', {type: Array}) readonly value!: any[]
  @Prop() readonly items!: any[]
  private mdiCloseBox = mdiCloseBox
  private mdiMinusBox = mdiMinusBox
  private mdiCheckboxBlankOutline = mdiCheckboxBlankOutline

  private get isSelectedAll (): boolean {
    const selectedItems = this.value
    return selectedItems.length === this.items?.length
  }

  private get isSelectedSome (): boolean {
    const selectedItems = this.value || []
    return selectedItems.length > 0 && !this.isSelectedAll
  }

  private toggleSelected () {
    this.$nextTick(() => {
      this.$emit(
        'input',
        this.isSelectedAll ? [] : this.items.slice()
      )
    })
  }
}
</script>
