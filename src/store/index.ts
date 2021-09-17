import Vue from 'vue'
import Vuex from 'vuex'
import _get from 'lodash.get'
import _set from 'lodash.set'
import createPersistedState from 'vuex-persistedstate'
import i18n, {Locales, defaultLocale} from '@/plugins/i18n'
import User from '@/entities/User'
import config from '@/config'

Vue.use(Vuex)

interface UIParams {
  measurements: {
    isRightPanelOpen: boolean
  }
  violations: {
    isRightPanelOpen: boolean
  }
  map: {
    isRightPanelOpen: boolean
  }
}

interface QueryForm {
  cities: string[]
  dateStart: string
  dateEnd: string
}

export class ModuleState {
  public locale: Locales = defaultLocale
  public queryForm: QueryForm = {
    cities: [],
    dateStart: '',
    dateEnd: '',
  }
  public ui: UIParams = {
    measurements: {
      isRightPanelOpen: true,
    },
    violations: {
      isRightPanelOpen: true,
    },
    map: {
      isRightPanelOpen: true,
    },
  }
  public currentUser: User | null = null
}

export default new Vuex.Store({
  state: new ModuleState(),
  getters: {
    GET(state) {
      return (key: string) => _get(state, key)
    },
  },
  actions: {
    SET(context, {key, value}: {key: string; value: any}) {
      context.commit('SET', {key, value})
    },
  },
  mutations: {
    SET(state, {key, value}: {key: string; value: any}) {
      _set(state, key, value)
    },
    SET_LOCALE: (state, payload: ModuleState['locale']) => {
      state.locale = payload
      i18n.locale = payload
    },
    SET_CURRENT_USER: (state, payload: ModuleState['currentUser']) => {
      state.currentUser = payload || null
    },
  },
  strict: config.get('NODE_ENV') !== 'production',
  plugins: [
    // use localStorage
    createPersistedState({
      key: `${config.get('APP_NAME')}-storage`,
    }),
  ],
})
