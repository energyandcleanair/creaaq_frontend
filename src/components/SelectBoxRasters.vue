<template>
<v-select
  :items="items"
  
  item-text="name"
  item-value="url"
  single-line
v-bind="$props"
v-model="value"
  v-on:change="$emit('input', $event)"

></v-select>
</template>

<script lang="ts">
import CountryFlag from 'vue-country-flag'
import {Vue, Component, Model, Prop} from 'vue-property-decorator'
import Raster from '@/entities/Raster'
import SelectBox from './SelectBox.vue'
import {RasterAPI} from "@/api/RasterAPI"
import {VSelect} from 'vuetify/lib'

@Component({
  components: {
    SelectBox,
    VSelect,
    CountryFlag,
  },
})
export default class SelectBoxRasters extends Vue {
  @Model('input', {type: String})
  value = ""

  @Prop()
  readonly items!: Raster[] 

  @Prop({type: String})
  readonly label?: string

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  public inputFilter(item: any, queryText: string, itemText: string): boolean {
    const _query = queryText.toLocaleLowerCase()
    return itemText.toLocaleLowerCase().indexOf(_query) > -1
  }
}
</script>
