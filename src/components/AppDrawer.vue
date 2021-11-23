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
        <v-list-item-group :value="selectedItemIndex" color="primary">
          <v-list-item
            :class="{
              'grey--text text--darken-1': item.disabled,
            }"
            v-for="(item, i) in menuItems"
            :key="i"
            :to="item.to"
            :disabled="item.disabled || selectedItemIndex === i"
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
        </v-list-item-group>
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
  mdiFileDownloadOutline,
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
  public open!: boolean

  public version: string = pkg.version

  public get selectedItemIndex(): number {
    return this.menuItems.findIndex(
      (item) => item?.to?.name === this.$route.name
    )
  }

  public get menuItems(): MenuItem[] {
    return [
      {
        label: this.$t('measurements').toString(),
        icon: mdiChartLine,
        to: {name: 'measurements'},
      },
      {
        label: this.$t('violations').toString(),
        icon: mdiCalendarMonth,
        to: {name: 'violations'},
      },
      {
        label: this.$t('stations').toString(),
        icon: mdiFactory,
        to: {name: 'stations'},
      },
      {
        label: this.$t('map').toString(),
        icon: mdiMapMarkerRadius,
        to: {name: 'map'},
      },
      {
        label: this.$t('download').toString(),
        icon: mdiFileDownloadOutline,
        to: {name: 'download'},
      },
    ]
  }
}
</script>
