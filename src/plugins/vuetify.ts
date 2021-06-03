import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: {
    themes: {
      light: {
        primary: {
          ...colors.blue,
          base: '#35416C',
        },
        secondary: {
          ...colors.purple,
          base: colors.purple.lighten1
        },
        info: {
          ...colors.teal,
          base: '#27a59c'
        },
        error: {
          ...colors.pink,
        },
        grey: {
          ...colors.grey,
        },
        blue: {
          ...colors.blue,
          base: '#8cc9D0'
        },
      }
    }
  }
})
