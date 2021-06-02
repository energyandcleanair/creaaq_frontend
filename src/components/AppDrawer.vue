<template>
<v-navigation-drawer app permanent clipped left width="200">
  <v-list dense>
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
        <v-list-item-title>{{ item.label }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mdiScaleBalance, mdiMapMarkerPath, mdiHomeAssistant } from '@mdi/js'
import { Location } from 'vue-router'

interface MenuItem {
  label: string
  icon: string
  to?: Location
  disabled?: boolean
}

@Component
export default class AppDrawer extends Vue {
  private get menuItems (): MenuItem[] {
    return [
      {
        label: this.$t('measurements').toString(),
        icon: mdiScaleBalance,
        to: {name: 'Measurements'},
        disabled: false
      },
      {
        label: this.$t('trajectories').toString(),
        icon: mdiMapMarkerPath,
        // to: {name: 'Trajectories'},
        disabled: true
      },
      {
        label: this.$t('stations').toString(),
        icon: mdiHomeAssistant,
        // to: {name: 'Stations'},
        disabled: true
      },
    ]
  }
}
</script>
