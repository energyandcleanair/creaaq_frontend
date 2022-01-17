import Vue from 'vue'
import VueRouter, {Route} from 'vue-router'
import VueGtm from '@gtm-support/vue2-gtm'
import config from '@/config'
import {trackGtmEvent} from './trackGtmEvent'

export const initGtmAnalytics = (router: VueRouter) => {
  if (config.get('GTM_ENABLED') === 'true' && !config.get('GTM_CONTAINER_ID')) {
    console.error(
      "Google Tag Manager plugin won't be initialized. Environment variable 'GTM_CONTAINER_ID' is not defined."
    )
    return
  }

  Vue.use(VueGtm, {
    id: config.get('GTM_CONTAINER_ID'),

    // Script can be set to `defer` to speed up page load at the cost of less accurate results (in case visitor leaves before script is loaded, which is unlikely but possible). Defaults to false, so the script is loaded `async` by default
    defer: true,

    // Will add `async` and `defer` to the script tag to not block requests for old browsers that do not support `async`
    compatibility: false,

    // defaults to true. Plugin can be disabled by setting this to false for Ex: enabled: !!GDPR_Cookie (optional)
    enabled: config.get('GTM_ENABLED') === 'true',

    // Whether or not display console logs debugs (optional)
    debug: config.get('NODE_ENV') === 'development',

    // Whether or not to load the GTM Script (Helpful if you are including GTM manually, but need the dataLayer functionality in your components) (optional)
    loadScript: true,

    // Pass the router instance to automatically sync with router (optional)
    vueRouter: undefined,

    // Don't trigger events for specified router names (optional)
    ignoredViews: [],

    // Whether or not call trackView in Vue.nextTick
    trackOnNextTick: false,
  })

  Vue.prototype.$trackGtmEvent = Vue.trackGtmEvent = trackGtmEvent

  // track unique view changes
  router.afterEach((to: Route) => {
    if (typeof to.name !== 'string') return

    // this is how you will see this record in the Vue.dataLayer array
    const data: DataLayerObjectView = {
      event: 'content-view',
      'content-view-name': to.name,
      'content-name': to.path,
    }

    const lastData = _getGTMLastDataLayerItem('event', 'content-view')
    const isSameView =
      lastData?.event === 'content-view' && lastData['content-name'] === to.path

    if (!Vue.gtm.enabled() || !to.name || isSameView) return
    Vue.gtm.trackView(data['content-view-name'], data['content-name'])
  })
}

type DataLayerContentViewName = string
type DataLayerContentViewPath = string
interface DataLayerObjectView {
  event: 'content-view'
  'content-view-name': DataLayerContentViewName
  'content-name': DataLayerContentViewPath
}

function _getGTMLastDataLayerItem(
  key: string,
  value: string
): DataLayerObjectView | null {
  const dataLayer = Vue.gtm.dataLayer()
  let resultItem: DataLayerObjectView | null = null

  if (dataLayer === false) return resultItem

  let i = dataLayer.length
  while (i--) {
    if (dataLayer[i][key] === value) {
      resultItem = dataLayer[i] as DataLayerObjectView
      break
    }
  }

  return resultItem
}
