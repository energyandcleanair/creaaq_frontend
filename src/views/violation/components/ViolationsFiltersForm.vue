<template>
  <v-form
    class="violations-filters-form"
    :class="{'violations-filters-form--disabled': disabled}"
  >
    <v-row no-gutters>
      <v-col cols="12">
        <span class="text-subtitle-1">{{ $t('primary_filter') }}:&nbsp;</span>
        <span class="text-body-1">{{ $t(filterPrimary) }}</span>
      </v-col>

      <v-col v-if="primaryFilterTree.length" class="pl-1" cols="12">
        <v-treeview
          ref="primaryFilterTree"
          class="v-treeview--hide-children v-treeview--hide-toggle v-treeview--label-no-truncate"
          :value="primaryFilterValue"
          :items="primaryFilterTree"
          :expand-icon="mdiMenuDown"
          :open-all="false"
          item-key="id"
          item-text="name"
          item-disabled="disabled"
          selected-color="primary"
          selection-type="leaf"
          selectable
          @input="onChangeTree('primary', $event)"
        >
          <template v-slot:label="{item}">
            <v-tooltip bottom>
              <template v-slot:activator="{on, attrs}">
                <span
                  class="d-inline-block text-truncate"
                  v-bind="attrs"
                  v-on="on"
                  v-text="item.name"
                  style="max-width: calc(100% - 25px)"
                />

                <v-icon
                  class="ml-2"
                  color="grey lighten-1"
                  @click="onClickDetails(filterPrimary, item)"
                  small
                >
                  {{ mdiInformationOutline }}
                </v-icon>
              </template>
              <span>{{ item.name }}</span>
            </v-tooltip>
          </template>
        </v-treeview>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="12">
        <span class="text-subtitle-1">{{ $t('secondary_filter') }}:&nbsp;</span>
        <span class="text-body-1">{{ filterSecondaryText }}</span>
      </v-col>

      <v-col v-if="secondaryFilterTree.length" class="pl-1" cols="12">
        <v-treeview
          ref="secondaryFilterTree"
          :value="secondaryFilterValue"
          :items="secondaryFilterTree"
          :expand-icon="mdiMenuDown"
          :open-all="false"
          item-key="id"
          item-disabled="disabled"
          selected-color="primary"
          selection-type="leaf"
          selectable
          @input="onChangeTree('secondary', $event)"
        >
          <template v-slot:label="{item}">
            <v-tooltip bottom>
              <template v-slot:activator="{on, attrs}">
                <span v-bind="attrs" v-on="on" v-text="item.name" />
              </template>
              <span>{{ item.description || item.name }}</span>
            </v-tooltip>
          </template>
        </v-treeview>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import _uniqBy from 'lodash.uniqby'
import {mdiInformationOutline, mdiMenuDown} from '@mdi/js'
import {Vue, Component, Prop, Ref} from 'vue-property-decorator'
import Pollutant from '@/entities/Pollutant'
import Regulation from '@/entities/Regulation'
import Target from '@/entities/Target'

export enum ViolationsPrimaryFilter {
  regulations = 'regulations',
}

export enum ViolationsSecondaryFilter {
  'pollutants/targets' = 'pollutants/targets',
}

export type ViolationsFilterValue =
  | Regulation['id']
  | Pollutant['id']
  | Target['id']

export interface ViolationsFilterItem {
  id: ViolationsFilterValue
  name: string
  description?: string
  disabled?: boolean
  regulation_id?: Regulation['id']
  pollutant?: Pollutant['id']
}

export interface ViolationsFilterTreeitem {
  id: string
  name: string
  children: any[]
}

interface TreeNode {
  children: string[]
  isActive: false
  isIndeterminate: false
  isOpen: false
  isSelected: true
  item: any
  parent: any | null
  vnode: Vue
}

@Component
export default class ViolationsFiltersForm extends Vue {
  @Ref('primaryFilterTree')
  public readonly $primaryFilterTree: any | undefined

  @Ref('secondaryFilterTree')
  public readonly $secondaryFilterTree: any | undefined

  @Prop({type: Array, required: true})
  public readonly valueRegulations!: Regulation['id'][]

  @Prop({type: Array, required: true})
  public readonly valuePollutants!: Pollutant['id'][]

  @Prop({type: Array, required: true})
  public readonly valueTargets!: Target['id'][]

  @Prop({
    type: String,
    required: true,
    validator: (v) => Object.keys(ViolationsPrimaryFilter).includes(v),
  })
  public readonly filterPrimary!: ViolationsPrimaryFilter

  @Prop({
    type: String,
    required: true,
    validator: (v) => Object.keys(ViolationsSecondaryFilter).includes(v),
  })
  public readonly filterSecondary!: ViolationsSecondaryFilter

  @Prop({type: Array, required: true})
  public readonly regulations!: Regulation[]

  @Prop({type: Array, required: true})
  public readonly pollutants!: Pollutant[]

  @Prop({type: Array, required: true})
  public readonly targets!: Target[]

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  public mdiMenuDown = mdiMenuDown
  public mdiInformationOutline = mdiInformationOutline

  public get primaryFilterItems(): ViolationsFilterItem[] {
    return this._getPrimaryFilterItems(this.filterPrimary)
  }

  // INFO: link to the secondaryFilterValue because the primary filter tree
  // is based on the secondaryFilterValue
  // WHY: the primary filter has hidden children which
  // are the secondaryFilterItems
  public get primaryFilterValue(): ViolationsFilterValue[] {
    return this.secondaryFilterValue
  }

  public get secondaryFilterItems(): ViolationsFilterItem[] {
    return this._getSecondaryFilterItems(this.filterSecondary)
  }
  public get secondaryFilterValue(): ViolationsFilterValue[] {
    return this._getSecondaryFilterValues(this.filterSecondary)
  }
  public get filterSecondaryText(): string {
    const parts = this.filterSecondary.split('/')
    return `${this.$t(parts[0])}/${this.$t(parts[1])}`
  }

  public get primaryFilterTree(): ViolationsFilterTreeitem[] {
    const tree: ViolationsFilterTreeitem[] = []

    for (const primaryItem of this.primaryFilterItems) {
      const children: any[] = []

      if (
        this.filterSecondary === ViolationsSecondaryFilter['pollutants/targets']
      ) {
        for (const secondaryItem of this.secondaryFilterItems) {
          if (secondaryItem.regulation_id === primaryItem.id) {
            children.push(secondaryItem)
          }
        }
      } else {
        throw new Error(`Unsupported fitler: ${this.filterSecondary}`)
      }

      tree.push({
        ...primaryItem,
        children,
      })
    }

    return tree
  }

  public get secondaryFilterTree(): ViolationsFilterTreeitem[] {
    const tree: ViolationsFilterTreeitem[] = []
    const items = this._getSecondaryFilterItems(this.filterSecondary)
    const pollutants = this.pollutants.map((item) =>
      this._parseToFilterItem(item, 'pollutant')
    )

    for (const pollutant of pollutants) {
      const children: any[] = []

      if (
        this.filterSecondary === ViolationsSecondaryFilter['pollutants/targets']
      ) {
        for (const target of items) {
          if (target.pollutant === pollutant.id) {
            children.push(target)
          }
        }
      } else {
        throw new Error(`Unsupported fitlers: ${this.filterSecondary}`)
      }

      tree.push({
        ...pollutant,
        children,
      })
    }

    return tree
  }

  public onChangeTree(tree: 'primary' | 'secondary', values: string[]) {
    const componentValue = {
      regulations: this.valueRegulations,
      pollutants: this.valuePollutants,
      targets: this.valueTargets,
    }

    if (tree === 'primary') {
      componentValue[this.filterPrimary] = this._getTreeSelectedParentItems(
        this.$primaryFilterTree
      )

      if (
        this.filterSecondary === ViolationsSecondaryFilter['pollutants/targets']
      ) {
        const pollutants = values.reduce((ids: string[], id: string) => {
          const tg = this.secondaryFilterItems.find((itm) => itm.id === id)
          if (tg?.pollutant && !ids.includes(tg?.pollutant)) {
            ids.push(tg?.pollutant)
          }
          return ids
        }, [])

        componentValue.pollutants = pollutants
        componentValue.targets = values
      }
    }

    if (tree === 'secondary') {
      if (
        this.filterSecondary === ViolationsSecondaryFilter['pollutants/targets']
      ) {
        componentValue.targets = values
        componentValue.pollutants = this._getTreeSelectedParentItems(
          this.$secondaryFilterTree
        )

        if (this.filterPrimary === ViolationsPrimaryFilter.regulations) {
          componentValue.regulations = values.reduce(
            (ids: string[], id: string) => {
              const tg = this.secondaryFilterItems.find((itm) => itm.id === id)
              if (tg?.regulation_id && !ids.includes(tg?.regulation_id)) {
                ids.push(tg?.regulation_id)
              }
              return ids
            },
            []
          )
        }
      }
    }

    this.onChangeForm(componentValue)
  }

  public onChangeForm(value: {
    regulations: Regulation['id'][]
    pollutants: Pollutant['id'][]
    targets: Target['id'][]
  }) {
    this.$emit('change', value)
  }

  public _getTreeSelectedParentItems($tree: any): string[] {
    const nodes: Record<string, TreeNode> = $tree.nodes
    const parentItems: ViolationsFilterItem[] = $tree.items
    const selectedIds = parentItems.reduce(
      (ids: string[], item: ViolationsFilterItem) => {
        const node: TreeNode | undefined = nodes[item.id]
        if (node && (node.isSelected || node.isIndeterminate)) ids.push(item.id)
        return ids
      },
      []
    )
    return selectedIds
  }

  public onClickDetails(
    type: ViolationsPrimaryFilter,
    filterItem: ViolationsFilterItem
  ) {
    let item

    if (type === ViolationsPrimaryFilter.regulations) {
      item = this.regulations.find(({id}) => id === filterItem.id)
    }

    this.$emit('click:item-details', type, item)
  }

  public _getPrimaryFilterItems(
    filter: ViolationsPrimaryFilter
  ): ViolationsFilterItem[] {
    let items = []
    let type: 'regulation' | 'pollutant' | 'target'

    switch (filter) {
      case ViolationsPrimaryFilter.regulations:
        type = 'regulation'
        items = this.regulations
        break
      default:
        throw new Error(`Unknown filter name: ${filter}`)
    }
    return (items as any[]).map((item) => this._parseToFilterItem(item, type))
  }

  public _getSecondaryFilterItems(
    filter: ViolationsSecondaryFilter
  ): ViolationsFilterItem[] {
    let items = []
    let type: 'regulation' | 'pollutant' | 'target'

    switch (filter) {
      case ViolationsSecondaryFilter['pollutants/targets']:
        type = 'target'
        items = this.targets
        break
      default:
        throw new Error(`Unknown filter name: ${filter}`)
    }

    return (items as any[]).map((item) => this._parseToFilterItem(item, type))
  }

  public _getSecondaryFilterValues(
    filter: ViolationsSecondaryFilter
  ): ViolationsFilterValue[] {
    switch (filter) {
      case ViolationsSecondaryFilter['pollutants/targets']:
        return this.valueTargets
      default:
        throw new Error(`Unknown filter name: ${filter}`)
    }
  }

  public _parseToFilterItem(
    item: Regulation | Pollutant | Target,
    type: 'regulation' | 'pollutant' | 'target'
  ): ViolationsFilterItem {
    let nameProp: keyof (Regulation | Pollutant | Target)

    switch (type) {
      case 'regulation':
        nameProp = 'name'
        break
      case 'pollutant':
        nameProp = 'name'
        break
      case 'target':
        nameProp = 'name'
        break
      default:
        nameProp = 'name'
    }

    return {
      id: item.id,
      name: item[nameProp],
      pollutant: (item as Target).pollutant,
      regulation_id: (item as Target).regulation_id,
    }
  }
}
</script>

<style lang="scss">
.violations-filters-form {
  max-width: 100%;

  &--disabled {
    .v-treeview {
      .v-treeview-node__checkbox {
        pointer-events: none;
        opacity: 0.3;
      }
    }
  }

  .v-treeview {
    max-width: 100%;
    overflow: hidden;
    margin-left: -12px;

    &.v-treeview--label-no-truncate {
      .v-treeview-node__label {
        text-overflow: initial !important;

        > * {
          vertical-align: middle;
        }
      }
    }

    &.v-treeview--hide-children {
      .v-treeview-node__children {
        display: none;
      }
    }

    &.v-treeview--hide-toggle {
      .v-treeview-node__toggle {
        display: none;
      }
    }
  }
}
</style>
