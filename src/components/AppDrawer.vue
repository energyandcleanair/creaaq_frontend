<template>
  <v-navigation-drawer
    class="app-drawer"
    :value="open"
    :permanent="open"
    app
    clipped
    left
    width="200"
  >
    <v-container class="d-flex flex-column fill-height pa-0" fluid>
      <v-list class="fill-width fill-height pt-2 pb-6" dense>
        <v-list-item-group
          class="fill-height"
          :value="selectedItemIndex"
          color="primary"
        >
          <template v-for="(item, i) in menuItems">
            <v-spacer v-if="item.spacerBefore" :key="`spacer-` + i" />

            <v-subheader
              v-if="item.section"
              :key="`section-` + i"
              v-text="item.section"
              style="height: 30px"
            />

            <v-list-item
              :class="{
                'grey--text text--darken-1': item.disabled,
              }"
              :key="i"
              :to="item.to"
              :disabled="item.disabled || selectedItemIndex === i"
            >
              <v-list-item-icon class="mr-4">
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-item-icon>

              <v-list-item-content>
                <v-list-item-title class="text-body-1" v-text="item.label" />
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list-item-group>
      </v-list>
    </v-container>

    <v-sheet class="app-drawer__footer fill-width d-flex justify-center pl-0">
      <span class="text-overline grey--text text--base">v{{ version }}</span>
    </v-sheet>
  </v-navigation-drawer>
</template>

<script lang="ts">
import {Component, Vue, Prop} from 'vue-property-decorator'
import {
  mdiChartLine,
  mdiMapMarkerRadius,
  mdiChartTimelineVariant,
  mdiCalendarMonth,
  mdiFactory,
  mdiEarth,
  mdiEarthBox
} from '@mdi/js'
import {Location} from 'vue-router'
import pkg from '../../package.json'

interface MenuItem {
  label: string
  icon: string
  to?: Location
  disabled?: boolean
  section?: string
  spacerBefore?: boolean
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
        label: this.$t('trajectories').toString(),
        icon: mdiChartTimelineVariant,
        to: {name: 'trajectories'},
      },
      {
        label: this.$t('Raster Map').toString(),
        icon: mdiEarthBox,
        to: {name: 'rasters'},
      },
      {
        spacerBefore: true,
        section: this.$t('advanced').toString(),
        label: 'TROPOMI NO2',
        icon: mdiEarth,
        to: {name: 'tropomiNo2'},
      },
    ]
  }
}
</script>

<style lang="scss">
.app-drawer {
  // TODO: complete
  .v-navigation-drawer__content {
    .v-list {
      .v-item-group {
        display: flex;
        flex-direction: column;

        .v-list-item {
          display: flex;
          flex: 0 0 auto;
        }
      }
    }
  }

  &__footer {
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
  }
}
</style>