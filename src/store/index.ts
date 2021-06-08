import Vue from 'vue'
import Vuex from 'vuex'
import _get from 'lodash.get'
import _set from 'lodash.set'
import createPersistedState from 'vuex-persistedstate'
import i18n, { Locales, defaultLocale } from '@/plugins/i18n'
import config from '@/config'

Vue.use(Vuex)

interface UIParams {
  measurements: {
    isRightPanelOpen: boolean
  }
}

export class ModuleState {
  public locale: Locales = defaultLocale
  public ui: UIParams = {
    measurements: {
      isRightPanelOpen: true
    }
  }
}

export default new Vuex.Store({
  state: new ModuleState(),
  getters: {
    GET (state) {
      return (key: string) => _get(state, key)
    },
  },
  actions: {
    SET (context, {key, value}: {key: string, value: any}) {
      context.commit('SET', {key, value})
    },
  },
  mutations: {
    SET (state, {key, value}: {key: string, value: any}) {
      _set(state, key, value)
    },
    SET_LOCALE: (state, payload: ModuleState['locale']) => {
      state.locale = payload
      i18n.locale = payload
    },
  },
  strict: config.value('NODE_ENV') !== 'production',
  plugins: [

    // use localStorage
    createPersistedState({
      key: `${config.value('APP_NAME')}-storage`
    })
  ]
})
