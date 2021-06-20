import Vue from 'vue'
import Auth from './Auth'

declare module 'vue/types/vue' {
  interface Vue {
    $auth: Auth
  }

  interface VueConstructor {
    auth: Auth
  }
}
