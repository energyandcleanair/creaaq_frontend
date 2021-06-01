import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'

import vuetify from '@/plugins/vuetify'
import '@/plugins/vuetify-dialog'
import i18n from '@/plugins/i18n'

import config from '@/config'
import router from '@/router'
import store from '@/store'
import App from '@/App.vue'
import '@/registerServiceWorker'

Vue.use(VueAxios, axios)

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: h => h(App)
}).$mount('#app')

Vue.config.productionTip = false
Vue.config.devtools = config.value('NODE_ENV') !== 'production'
i18n.locale = store.state.locale
