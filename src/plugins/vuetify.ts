import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import colors from 'vuetify/lib/util/colors'
import theme from '@/theme'

Vue.use(Vuetify)

export default new Vuetify({
  customVariables: ['@/styles/_variables.scss'],
  treeShake: true,
  icons: {
    iconfont: 'mdiSvg',
  },
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: {
          ...colors.blue,
          ...theme.colors.darkBlue,
        },
        secondary: {
          ...colors.green,
          base: '#27a59c',
        },
        info: {
          ...colors.teal,
          ...theme.colors.darkBlue,
        },
        error: {
          ...colors.pink,
        },
        grey: {
          ...colors.grey,
        },
        purple: {
          ...colors.purple,
          ...theme.colors.purple,
        },
        blue: {
          ...colors.blue,
          ...theme.colors.blue,
        },
      },
    },
  },
})
