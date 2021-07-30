<template>
<component
  :is="_tagName"
  :filter="filter"
  :items="privateItems"
  chips
  multiple
  clearable
  attached
  v-bind="$props"
  v-on="$listeners"
>
  <template v-slot:selection="{ item, index }">
    <v-chip v-if="index + 1 <= visibleChips">
      <span>
        <slot name="item-title" v-bind:item="item">
          <span
            v-html="typeof $props.itemText === 'function'
              ? $props.itemText(item)
              : item[$props.itemText || 'name']"
          />
        </slot>
      </span>

      <span v-if="showSubtitleInChip && $scopedSlots['item-subtitle']" class="pl-1">
        <slot name="item-subtitle" v-bind:item="item"/>
      </span>
    </v-chip>
    <span
      v-if="index === visibleChips"
      class="grey--text text-caption"
    >
      (+{{ value.length - visibleChips }})
    </span>
  </template>

  <template
    v-if="items.length && (isShowSelectAll || isShowDeselectAll)"
    v-slot:prepend-item
  >
    <v-list-item aria-selected="true" role="option" @click="toggleSelected">
      <v-list-item-action>
        <v-icon :color="isSelectedSome ? 'indigo darken-4' : ''">
          {{ generalSelectorButtonIcon }}
        </v-icon>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title v-text="generalSelectorButtonText"/>
      </v-list-item-content>
    </v-list-item>
    <v-divider class="mt-2"></v-divider>
  </template>

  <template v-slot:item="{ on, attrs, item }">
    <v-list-item v-bind="attrs" v-on="on">
      <v-list-item-action>
        <v-simple-checkbox class="pointer-events-none" :value="attrs.inputValue"/>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title>
          <slot name="item-title" v-bind:item="item">
            <span
              v-html="typeof $props.itemText === 'function'
                ? $props.itemText(item)
                : item[$props.itemText || 'name']"
            />
          </slot>
        </v-list-item-title>
        <v-list-item-subtitle v-if="$scopedSlots['item-subtitle']">
          <slot name="item-subtitle" v-bind:item="item"/>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
  </template>
</component>
</template>

<script lang="ts">
import _sortBy from 'lodash.sortby'
import { mdiCloseBox, mdiMinusBox, mdiCheckboxBlankOutline } from '@mdi/js'
import { Component, Model, Prop } from 'vue-property-decorator'
import { VAutocomplete, VSelect } from 'vuetify/lib'

const defaultFilter = (item: any, queryText: string, itemText: string) => {
  return itemText.toLocaleLowerCase().indexOf(queryText.toLocaleLowerCase()) > -1
}

@Component({
  components: {
    VSelect,
    VAutocomplete,
  }
})
export default class SelectBox extends VSelect {

  @Model('input', {type: Array})
  readonly value!: any[]

  @Prop()
  readonly items!: any[]

  @Prop({type: Boolean, default: false})
  readonly hasSelectAll!: boolean

  @Prop({type: Boolean, default: false})
  readonly hasDeselectAll!: boolean

  @Prop({type: Boolean, default: false})
  readonly showSubtitleInChip!: boolean

  @Prop({type: Boolean, default: false})
  readonly selectedFirst!: boolean

  @Prop({type: Number, default: 1})
  readonly visibleChips!: number

  @Prop({type: String})
  readonly tagName?: 'v-autocomplete'|'v-select'

  @Prop({type: Function, default: defaultFilter})
  readonly filter: any

  private get privateItems (): any[] {
    if (!this.selectedFirst) return this.items

    const valueProp = this.$props.itemValue || 'value'
    const orderArr = !this.$props.returnObject
      ? this.value || []
      : (this.value || []).map(item => item[valueProp])

    const lastIndex = this.items.length;
    const sortedArr = _sortBy(this.items, (item) => {
      const i = orderArr.indexOf(item[valueProp])
      return i !== -1 ? i : lastIndex
    })

    return sortedArr
  }

  private get _tagName (): 'v-autocomplete'|'v-select' {
    if (this.tagName) return this.tagName
    return this.$vuetify.breakpoint.mdAndUp ? 'v-autocomplete' : 'v-select'
  }

  private get generalSelectorButtonIcon (): string {
    if (this.isShowDeselectAll) return mdiCloseBox
    if (this.isShowSelectAll) {
      return this.isSelectedSome
        ? mdiMinusBox
        : mdiCheckboxBlankOutline
    }
    return ''
  }

  private get generalSelectorButtonText (): string {
    const length = this.items.length
    if (this.isShowDeselectAll) {
      return this.$t('deselect_all').toString() + ` (${this.value.length})`
    }
    if (this.isShowSelectAll) {
      return this.$t('select_all').toString() + ` (${this.items.length})`
    }
    return ''
  }

  private get isShowSelectAll (): boolean {
    return !this.isSelectedAll && this.hasSelectAll
  }

  private get isShowDeselectAll (): boolean {
    if (!this.hasDeselectAll) return false
    if (this.hasSelectAll) return this.isSelectedAll
    else return this.isSelectedSome || this.isSelectedAll
  }

  private get isSelectedAll (): boolean {
    const selectedItems = this.value
    return selectedItems.length === this.items?.length
  }

  private get isSelectedSome (): boolean {
    const selectedItems = this.value || []
    return selectedItems.length > 0 && !this.isSelectedAll
  }

  private toggleSelected ($event: any) {
    let newVal: any[] = []
    if (this.isShowDeselectAll) newVal = []
    if (this.isShowSelectAll) newVal = this.items.slice()

    if (!(this as any).returnObject) {
      newVal = newVal.map(itm => itm[(this as any).itemValue || 'value'])
    }

    this.$nextTick(() => {
      this.$emit(
        'input',
        newVal
      )
    })
  }
}
</script>
