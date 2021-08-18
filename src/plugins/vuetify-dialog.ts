import Vue from 'vue'
import VuetifyDialog from 'vuetify-dialog'
import vuetify from '@/plugins/vuetify'
import 'vuetify-dialog/dist/vuetify-dialog.css'

Vue.use(VuetifyDialog, {
  context: {
    vuetify,
  },
})
