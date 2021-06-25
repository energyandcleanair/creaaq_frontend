<template>
<SelectBox
  :filter="citiesInputFilter"
  item-text="name"
  item-value="id"
  hide-details
  has-deselect-all
  v-bind="$props"
  v-on="$listeners"
>
  <template v-slot:item-subtext="{item}">
    <CountryFlag
      :country="(item.country_id || '').toLowerCase()"
      size="small"
    />
    <span class="grey--text text--base">
      &nbsp;&nbsp;{{ item.country_name }}
    </span>
  </template>
</SelectBox>
</template>

<script lang="ts">
import CountryFlag from 'vue-country-flag'
import { Vue, Component, Model, Prop } from 'vue-property-decorator'
import City from '@/entities/City'
import SelectBox from './SelectBox.vue'

@Component({
  components: {
    SelectBox,
    CountryFlag,
  }
})
export default class SelectBoxCities extends Vue {
  @Model('input', {type: Array})
  readonly value!: any[]

  @Prop()
  readonly items!: City[]

  @Prop({type: String})
  readonly label?: string

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  private citiesInputFilter (item: any, queryText: string, itemText: string): boolean {
    const _query = queryText.toLocaleLowerCase()
    return itemText.toLocaleLowerCase().indexOf(_query) > -1 ||
      (item.country_name || '').toLocaleLowerCase().indexOf(_query) > -1
  }
}
</script>
