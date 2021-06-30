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
    <CountryFlag
      :country="(item.id || '').toLowerCase()"
      size="small"
    />
    <span>
      &nbsp;&nbsp;{{ item.name }}
    </span>
  </template>
</SelectBox>
</template>

<script lang="ts">
import CountryFlag from 'vue-country-flag'
import { Vue, Component, Model, Prop } from 'vue-property-decorator'
import Country from '@/entities/Country'
import SelectBox from './SelectBox.vue'

@Component({
  components: {
    SelectBox,
    CountryFlag,
  }
})
export default class SelectBoxCountries extends Vue {
  @Model('input', {type: Array})
  readonly value!: any[]

  @Prop()
  readonly items!: Country[]

  @Prop({type: String})
  readonly label?: string

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  private inputFilter (item: any, queryText: string, itemText: string): boolean {
    const _query = queryText.toLocaleLowerCase()
    return itemText.toLocaleLowerCase().indexOf(_query) > -1
  }
}
</script>
