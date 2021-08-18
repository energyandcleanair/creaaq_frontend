import Auth from './Auth'

/**
 * @param {VueComponent} Vue
 * @param {object} options
 */
function plugin(Vue: any, options: {store: any; firebase: any}): void {
  if (!options.store) {
    throw new Error('Store is not initialized.')
  }
  if (!options.firebase) {
    throw new Error('Firebase is not initialized.')
  }

  if ((plugin as any).installed) return
  ;(plugin as any).installed = true

  Vue.auth = new Auth(options.store, options.firebase)

  Object.defineProperties(Vue.prototype, {
    $auth: {
      get: () => Vue.auth,
    },
  })
}

export default plugin
export {Auth}
