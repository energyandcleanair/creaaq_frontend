<template>
<v-navigation-drawer
  class="page-drawer"
  :value="open"
  app
  clipped
  right
  width="230"
  mobile-breakpoint="960"
  @input="toggle($event)"
>

  <template v-slot:prepend>
    <v-btn
      class="drawer-handler"
      :title="$t('display_parameters')"
      :style="{'margin-top': $vuetify.application.top + 'px'}"
      color="primary"
      icon
      @click="toggle(!open)"
    >
      <v-icon>{{ mdiTune }}</v-icon>
    </v-btn>

    <v-toolbar height="40" flat>
      <v-spacer/>

      <v-btn icon small @click="toggle(!open)">
        <v-icon small>{{ mdiClose }}</v-icon>
      </v-btn>
    </v-toolbar>
  </template>

  <div class="drawer__content px-3">
    <slot/>
  </div>
</v-navigation-drawer>
</template>

<script lang="ts">
import _difference from 'lodash.difference'
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import { mdiClose, mdiTune } from '@mdi/js'

@Component
export default class PageDrawer extends Vue {
  @Prop({type: Boolean, default: false})
  readonly open!: boolean

  private mdiClose = mdiClose
  private mdiTune = mdiTune

  @Emit('input')
  @Emit('update:open')
  public toggle (value: boolean) {}
}
</script>

<style lang="scss">
.page-drawer {
  overflow: visible;

  &.v-navigation-drawer--close {
    visibility: visible !important;

    .v-navigation-drawer__content,
    .v-navigation-drawer__border {
      visibility: hidden !important;
    }
  }

  .v-navigation-drawer__prepend {
    position: relative;

    .drawer-handler {
      position: absolute;
      left: -2.7rem;
      top: .5rem;
      width: 2.7rem;
      height: 2rem;
      z-index: 10;
      border-radius: 0.2rem;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &.v-navigation-drawer--open {
    .drawer-handler {
      display: none;
    }
  }

  &:not(.v-navigation-drawer--is-mobile) {
    .drawer-handler {
      margin-top: 0 !important;
    }
  }

  .drawer__content {
    overflow: auto;
    padding-bottom: 7rem;

    .row {
      margin-bottom: 2rem;
    }
  }
}
</style>