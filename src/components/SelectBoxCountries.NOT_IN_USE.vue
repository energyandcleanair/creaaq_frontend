<template>
<v-menu
  content-class="select-countries"
  v-model="isMenuOpen"
  :close-on-content-click="false"
>
  <template v-slot:activator="{ attrs }">
    <v-select
      :label="$attrs.label"
      item-text="name"
      item-value="id"
      multiple
      hide-details
      has-deselect-all
      readonly
      v-bind="attrs"
      @click.native="isMenuOpen = !isMenuOpen"
    />
  </template>

  <v-card>
    <v-text-field
      v-model="search"
      hide-details
    />

    <v-treeview
      :value="value"
      :items="items"
      :search="search"
      item-children="_cities"
      multiple-active
      selection-type="leaf"
      selectable
      open-all
      open-on-click
    ></v-treeview>
  </v-card>
</v-menu>
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
  readonly value!: Country[]

  @Prop()
  readonly items!: Country[]

  @Prop({type: String})
  readonly label?: string

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  readonly search: string = ''
  readonly isMenuOpen: boolean = false
}
</script>

<style lang="scss">
.select-countries {
  max-height: 400px;
}
</style>