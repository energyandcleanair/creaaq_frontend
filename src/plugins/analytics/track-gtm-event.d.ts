import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $trackGtmEvent: ITrackGtmEventHandler
  }

  interface VueConstructor {
    trackGtmEvent: ITrackGtmEventHandler
  }
}
