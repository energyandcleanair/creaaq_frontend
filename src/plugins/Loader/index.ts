import _set from 'lodash.set'
import {addMixinIfDoesntExist, getObjectFallback} from './helpers'
import Loader from './Loader.vue'

export default {
  /**
   * @param {VueComponent} Vue
   * @param {object} config
   * @param {string} config.componentName
   */
  install(Vue: any, config: any = {}) {
    _set(Vue.prototype, '$loader', getObjectFallback('$loader'))

    Vue.prototype.$loader.isLoading = false

    /**
     * Add mixin to the `Loader` to assign value to the `Vue.$loader`
     */
    addMixinIfDoesntExist(Loader, {
      mixinId: '$loader',
      created() {
        Vue.prototype.$loader = this
      },
    })

    Vue.component(config.componentName || 'Loader', Loader)
  },
}
