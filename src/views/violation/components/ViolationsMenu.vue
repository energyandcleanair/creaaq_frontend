<template>
  <v-menu :close-on-content-click="false" offset-y left>
    <template v-slot:activator="{on, attrs}">
      <v-btn class="ml-3" color="grey darken-2" icon v-bind="attrs" v-on="on">
        <v-icon>{{ mdiMenu }}</v-icon>
      </v-btn>
    </template>

    <v-list>
      <v-list-item @click="isRightPanelOpen = !isRightPanelOpen">
        <v-list-item-action class="mr-3">
          <v-checkbox
            class="pointer-events-none"
            v-model="isRightPanelOpen"
            color="primary"
            readonly
          />
        </v-list-item-action>
        <v-list-item-title v-text="$t('display_parameters_panel')" />
      </v-list-item>

      <v-list-item
        @click="isAutoRefreshOnQueryChange = !isAutoRefreshOnQueryChange"
      >
        <v-list-item-action class="mr-3">
          <v-checkbox
            class="pointer-events-none"
            v-model="isAutoRefreshOnQueryChange"
            color="primary"
            readonly
          />
        </v-list-item-action>
        <v-list-item-title v-text="$t('auto_refresh_on_query_change')" />
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import {mdiMenu, mdiTune} from '@mdi/js'
import {Component, Vue} from 'vue-property-decorator'

@Component
export default class ViolationsMenu extends Vue {
  public readonly mdiMenu = mdiMenu
  public readonly mdiTune = mdiTune

  public get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.violations.isRightPanelOpen')
  }
  public set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.violations.isRightPanelOpen', value})
  }

  public get isAutoRefreshOnQueryChange(): boolean {
    return this.$store.getters.GET('ui.violations.isAutoRefreshOnQueryChange')
  }
  public set isAutoRefreshOnQueryChange(value: boolean) {
    this.$store.commit('SET', {
      key: 'ui.violations.isAutoRefreshOnQueryChange',
      value,
    })
  }
}
</script>
