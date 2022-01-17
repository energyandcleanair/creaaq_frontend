<template>
  <v-navigation-drawer
    class="page-drawer"
    :value="open"
    right
    width="250"
    mobile-breakpoint="960"
    @input="toggle($event)"
  >
    <template v-slot:prepend>
      <PageDrawerHandlerBtn
        v-if="showOpenButton"
        class="drawer-handler"
        :style="{'margin-top': $vuetify.application.top + 'px'}"
        @click="toggle(!open)"
      />

      <v-toolbar height="40" flat>
        <v-spacer />

        <v-btn icon small @click="toggle(!open)">
          <v-icon small>{{ mdiClose }}</v-icon>
        </v-btn>
      </v-toolbar>
    </template>

    <div class="drawer__content px-3 pb-1">
      <slot />
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts">
import _difference from 'lodash.difference'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import {mdiClose, mdiTune} from '@mdi/js'
import PageDrawerHandlerBtn from './PageDrawerHandlerBtn.vue'

@Component({
  components: {
    PageDrawerHandlerBtn,
  },
})
export default class PageDrawer extends Vue {
  @Prop({type: Boolean, default: false})
  readonly open!: boolean

  @Prop({type: Boolean, default: true})
  readonly showOpenButton!: boolean

  public mdiClose = mdiClose
  public mdiTune = mdiTune

  @Emit('input')
  @Emit('update:open')
  public toggle(value: boolean) {}
}
</script>

<style lang="scss">
.page-drawer {
  overflow: visible;
  position: absolute;
  z-index: 20;

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
      left: -(2.7rem + 1rem);
      top: 2.2rem;
      width: 2.7rem;
      height: 2.7rem;
      z-index: 10;
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

  .v-navigation-drawer__content {
    overflow: hidden;
  }

  .drawer__content {
    overflow-y: auto;
    height: 100%;
    // overflow: hidden;

    .row {
      margin-bottom: 2rem;
    }
  }
}
</style>
