import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import colors from 'vuetify/lib/util/colors'
import theme from '@/theme'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: {
          ...colors.blue,
          base: theme.colors.darkBlue.base,
        },
        secondary: {
          ...colors.purple,
          base: colors.purple.lighten1,
        },
        info: {
          ...colors.teal,
          base: theme.colors.darkBlue.base,
        },
        error: {
          ...colors.pink,
        },
        grey: {
          ...colors.grey,
        },
        blue: {
          ...colors.blue,
          base: theme.colors.blue.base,
        },
      }
    }
  }
})
