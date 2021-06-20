import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

import PluginLoader from '@/plugins/Loader'
import vuetify from '@/plugins/vuetify'
import PluginAuth from '@/plugins/Auth'
import i18n from '@/plugins/i18n'
import '@/plugins/vuetify-dialog'
import firebase from '@/plugins/firebase'
import '@/styles/index.scss'

import config from '@/config'
import router from '@/router'
import store from '@/store'
import App from '@/App.vue'
import '@/registerServiceWorker'

Vue.use(VueAxios, axios)
Vue.use(PluginAuth, {store, firebase})
Vue.use(PluginLoader, {componentName: 'CustomLoader'})

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: h => h(App)
}).$mount('#app')

Vue.config.productionTip = false
Vue.config.devtools = config.get('NODE_ENV') !== 'production'
i18n.locale = store.state.locale
