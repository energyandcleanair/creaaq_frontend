<template>
  <v-navigation-drawer
    :value="open"
    :permanent="open"
    app
    clipped
    left
    width="200"
  >
    <v-container class="d-flex flex-column fill-height pa-0" fluid>
      <v-list class="fill-width" dense>
        <v-list-item
          :class="{'grey--text text--darken-1': item.disabled}"
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :disabled="item.disabled"
        >
          <v-list-item-icon class="mr-4">
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title class="text-body-1">{{
              item.label
            }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-sheet class="mt-auto fill-width d-flex justify-center pl-0">
        <span class="text-overline grey--text text--base">v{{ version }}</span>
      </v-sheet>
    </v-container>
  </v-navigation-drawer>
</template>

<script lang="ts">
import {Component, Vue, Prop} from 'vue-property-decorator'
import {
  mdiChartLine,
  mdiMapMarkerRadius,
  mdiCalendarMonth,
  mdiFactory,
} from '@mdi/js'
import {Location} from 'vue-router'
import pkg from '../../package.json'

interface MenuItem {
  label: string
  icon: string
  to?: Location
  disabled?: boolean
}

@Component
export default class AppDrawer extends Vue {
  @Prop({type: Boolean, default: false})
  private open!: boolean

  private version: string = pkg.version

  private get menuItems(): MenuItem[] {
    return [
      {
        label: this.$t('measurements').toString(),
        icon: mdiChartLine,
        to: {name: 'measurements'},
        disabled: false,
      },
      {
        label: this.$t('violations').toString(),
        icon: mdiCalendarMonth,
        to: {name: 'violations'},
        disabled: false,
      },
      {
        label: this.$t('stations').toString(),
        icon: mdiFactory,
        to: {name: 'stations'},
        disabled: false,
      },
      {
        label: this.$t('map').toString(),
        icon: mdiMapMarkerRadius,
        to: {name: 'map'},
        disabled: false,
      },
    ]
  }
}
</script>
