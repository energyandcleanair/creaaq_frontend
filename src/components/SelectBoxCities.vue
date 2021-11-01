<template>
  <div>
    <div v-if="$props.label" class="caption grey--text text--darken-2">
      {{ $props.label }}
    </div>

    <treeselect
      ref="input"
      :value="value"
      :cacheOptions="false"
      :defaultOptions="filteredCountries"
      :load-options="loadItems"
      :limitText="(count) => `(+${count})`"
      :noResultsText="$t('msg.no_results_found')"
      :searchPromptText="$t('msg.type_to_search')"
      :disabled="disabled"
      :limit="3"
      placeholder=""
      valueConsistsOf="LEAF_PRIORITY"
      searchable
      clearable
      multiple
      async
      @input="onChangeValue"
    >
      <div slot="value-label" slot-scope="{node}">
        {{ node.raw.name }}
      </div>

      <div slot="option-label" slot-scope="{node}">
        <span class="pl-1">
          <CountryFlag
            v-if="node.raw.type === 'country'"
            :country="(node.raw.country_id || '').toLowerCase()"
            size="small"
          />
        </span>
        <span class="grey--text text--base">
          &nbsp;&nbsp;{{ node.raw.name }}
        </span>
        <span
          v-if="node.raw.type === 'country' && node.raw.childrenLength"
          class="caption grey--text text--lighten-1"
        >
          &nbsp;({{ node.raw.childrenLength }})
        </span>
      </div>
    </treeselect>
  </div>
</template>

<script lang="ts">
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import Treeselect, {ASYNC_SEARCH} from '@riophae/vue-treeselect'
import _orderBy from 'lodash.orderby'
import _sortBy from 'lodash.sortby'
import CountryFlag from 'vue-country-flag'
import {Vue, Component, Model, Prop, Emit, Watch} from 'vue-property-decorator'
import City from '@/entities/City'
import {_runIteration} from '@/utils'

@Component({
  components: {
    Treeselect,
    CountryFlag,
  },
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

  private searchQuery: string = ''
  private privateItems: any[] = []

  get countries(): any[] {
    const map = this.items.reduce((memo: any, city: City) => {
      if (memo[city.country_id]) {
        memo[city.country_id].children.push(city)
        memo[city.country_id].childrenLength++
      } else {
        memo[city.country_id] = {
          id: city.country_id,
          country_id: city.country_id,
          name: city.country_name,
          type: 'country',
          children: [city],
          childrenLength: 1,
          isDefaultExpanded: false,
        }
      }
      return memo
    }, {})

    return _orderBy(Object.values(map), 'name')
  }

  get selectedCountriesIds(): string[] {
    const selectedIds = this.value || []
    const countriesIds: string[] = Object.keys(
      this.items.reduce((ids: {[id: string]: number}, city: City) => {
        if (!ids[city.country_id] && selectedIds.includes(city.id)) {
          ids[city.country_id] = 1
        }
        return ids
      }, {})
    )
    return countriesIds
  }

  get selectedCountries(): any[] {
    const countriesIds: string[] = this.selectedCountriesIds
    const countries = this.countries.filter((country) =>
      countriesIds.includes(country.id)
    )
    return countries
  }

  get filteredCountries(): any[] {
    const countriesIds: string[] = this.selectedCountriesIds
    const lastIndex = this.countries.length
    const sortedArr = _sortBy([...this.countries], (item) => {
      const i = countriesIds.indexOf(item.id)
      if (i !== -1) item.isDefaultExpanded = true
      return i !== -1 ? i : lastIndex
    })
    return sortedArr
  }

  @Emit('input')
  private onChangeValue(value: any) {
    setTimeout(() => {
      const $input: any = this.$refs.input
      $input?.initialize()
    }, 300)
  }

  @Watch('items')
  private onChangeValue2(value: any) {
    setTimeout(() => {
      const $input: any = this.$refs.input
      $input?.initialize()
    }, 300)
  }

  private async loadItems({action, searchQuery, callback}: any): Promise<void> {
    if (action === ASYNC_SEARCH) {
      if (!searchQuery) {
        callback(null, this.filteredCountries)
        return
      }

      const chunkSize = 5
      const numTimes = this.filteredCountries.length / chunkSize
      const delay = 100
      const results: any[] = []

      await _runIteration(
        (index: number) => {
          const _query = searchQuery.trim().toLocaleLowerCase()

          const countries = this.filteredCountries.slice(
            index * chunkSize,
            index * chunkSize + chunkSize
          )

          for (const country of countries) {
            const name = country.name?.toLocaleLowerCase() || ''

            if (name.indexOf(_query) > -1) {
              results.push({
                ...country,
                isDefaultExpanded: true,
              })
              return
            }

            if (country.children) {
              const cities: any[] = []
              for (const city of country.children) {
                const nameCity = city.name?.toLocaleLowerCase() || ''
                if (nameCity.indexOf(_query) > -1) cities.push(city)
              }

              if (cities.length) {
                results.push({
                  ...country,
                  children: cities,
                  childrenLength: cities.length,
                  isDefaultExpanded: true,
                })
              }
            }
          }
        },
        numTimes,
        delay
      )

      callback(null, results)
    }
  }
}
</script>
