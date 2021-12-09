import Vue from 'vue'
// import * as login from './types/login'
// // import * as custom from './types/custom'

// type Opps = login.ITrackGtmEventHandler | custom.ITrackGtmEventHandler
// type Opps = login.ITrackGtmEventHandler
type Opps = ITrackGtmEventHandler
// type Opps = any

declare module 'vue/types/vue' {
  interface Vue {
    $trackGtmEvent: ITrackGtmEventHandler
  }

  interface VueConstructor {
    trackGtmEvent: ITrackGtmEventHandler
  }
}

// interface ITrackGtmEventHandler {
//   (eventCategory: any, action: any, label?: any): void
// }
