<template>
  <SelectBox
    :filter="inputFilter"
    item-text="name"
    item-value="id"
    hide-details
    has-deselect-all
    v-bind="$props"
    v-on="$listeners"
  >
    <template v-slot:item-title="{item}">
      <CountryFlag :country="(item.id || '').toLowerCase()" size="small" />
      <span> &nbsp;&nbsp;{{ item.name }} </span>
    </template>
  </SelectBox>
</template>

<script lang="ts">
import CountryFlag from 'vue-country-flag'
import {Vue, Component, Model, Prop} from 'vue-property-decorator'
import Raster from '@/entities/Raster'
import SelectBox from './SelectBox.vue'
import {RasterAPI} from "@/api/RasterAPI"

@Component({
  components: {
    SelectBox,
    CountryFlag,
  },
})
export default class SelectBoxRasters extends Vue {
  @Model('input', {type: Array})
  readonly value!: any[]

  @Prop()
  items!: Raster[]

  @Prop({type: String})
  readonly label?: string

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  readonly rasterApi = new RasterAPI()

  mounted() {
    this.rasterApi.get_rasters().then((rasters: Raster[]) => {
      this.items = rasters
    })
  }

  public inputFilter(item: any, queryText: string, itemText: string): boolean {
    const _query = queryText.toLocaleLowerCase()
    return itemText.toLocaleLowerCase().indexOf(_query) > -1
  }
}
</script>
