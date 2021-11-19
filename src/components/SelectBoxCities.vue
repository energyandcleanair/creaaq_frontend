<template>
  <div>
    <div v-if="$props.label" class="caption grey--text text--darken-2">
      {{ $props.label }}
    </div>

    <treeselect
      ref="tree"
      v-custom-should-expand-handler
      :value="value"
      :cache-options="false"
      :default-options="sortedCountries"
      :load-options="loadItems"
      async
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
      @input="onChangeValue"
    >
      <div slot="value-label" slot-scope="{node}">
        {{ node.label }}
      </div>

      <div slot="option-label" slot-scope="{node}">
        <span class="pl-1">
          <CountryFlag
            v-if="node.raw.level === 'country'"
            :country="(node.raw.id || '').toLowerCase()"
            size="small"
          />
        </span>
        <span class="grey--text text--base">
          &nbsp;&nbsp;{{ node.label }}
        </span>
        <span
          v-if="node.raw.level === 'country' && node.raw.childrenLength"
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
import {
  Vue,
  Component,
  Model,
  Prop,
  Emit,
  Watch,
  Ref,
} from 'vue-property-decorator'
import City from '@/entities/City'
import {_runIteration} from '@/utils'
import Country from '@/entities/Country'

interface CityOption extends City {
  label: City['name']
}

interface CountryOption extends Country {
  label: Country['name']
  children: CityOption[]
  childrenLength: number
  isDefaultExpanded?: boolean
}

const customShouldExpandHandler = {
  inserted(_: any, __: any, vnode: any) {
    const self = vnode.componentInstance
    self.__shouldExpand = self.shouldExpand
    self.shouldExpand = (node: any): boolean =>
      !!self.trigger.searchQuery || self.__shouldExpand(node)
  },
}

@Component({
  directives: {
    customShouldExpandHandler,
  },
  components: {
    Treeselect,
    CountryFlag,
  },
})
export default class SelectBoxCities extends Vue {
  @Ref('tree')
  readonly $tree!: any

  @Model('input', {type: Array})
  readonly value!: any[]

  @Prop()
  readonly items!: City[]

  @Prop({type: String})
  readonly label?: string

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  public searchQuery: string = ''
  public privateItems: any[] = []

  get countries(): CountryOption[] {
    const map = this.items.reduce(
      (memo: Record<string, CountryOption>, city: City) => {
        if (!memo[city.country_id]) {
          memo[city.country_id] = {
            id: city.country_id,
            name: city.country_name,
            label: city.country_name,
            level: 'country',
            children: [],
            childrenLength: 0,
            isDefaultExpanded: false,
          }
        }

        const cityOption: CityOption = {
          ...city,
          label: city.name,
        }

        memo[city.country_id].children?.push(cityOption)
        memo[city.country_id].childrenLength++
        return memo
      },
      {}
    )

    return _orderBy(Object.values(map), 'label')
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

  get selectedCountries(): CountryOption[] {
    const countriesIds: string[] = this.selectedCountriesIds
    const countries = this.countries.filter((country) =>
      countriesIds.includes(country.id)
    )
    return countries
  }

  get sortedCountries(): CountryOption[] {
    const countriesIds: string[] = this.selectedCountriesIds
    const lastIndex = this.countries.length
    const sortedArr = _sortBy(this.countries, (item) => {
      const i = countriesIds.indexOf(item.id)
      if (i !== -1) item.isDefaultExpanded = true
      return i !== -1 ? i : lastIndex
    })
    return sortedArr
  }

  @Emit('input')
  public onChangeValue(value: any) {
    setTimeout(() => {
      this.$tree?.initialize()
    }, 300)
  }

  @Watch('items')
  public onChangeValue2(value: any) {
    setTimeout(() => {
      this.$tree?.initialize()
    }, 300)
  }

  public async loadItems({action, searchQuery, callback}: any): Promise<void> {
    if (action !== ASYNC_SEARCH) return undefined

    if (!searchQuery) {
      callback(null, this.sortedCountries)
      return
    }

    const chunkSize = 5
    const numTimes = this.sortedCountries.length / chunkSize
    const delay = 100
    const results: any[] = []

    await _runIteration(
      (index: number) => {
        const _query = searchQuery.trim().toLocaleLowerCase()

        const countries = this.sortedCountries.slice(
          index * chunkSize,
          index * chunkSize + chunkSize
        )

        for (const country of countries) {
          const name = country.name?.toLocaleLowerCase() || ''

          if (name.indexOf(_query) > -1) {
            results.push(country)
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
                label: country.name,
                children: cities,
                childrenLength: cities.length,
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
</script>
