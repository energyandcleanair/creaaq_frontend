import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Locales, { LOCALES_CONFIG } from './Locales'
import en from './en'

Vue.use(VueI18n)

const browserLocale: string = navigator.languages
  ? navigator.languages[0]
  : (navigator.language || (navigator as any).userLanguage)
const browserShortLocale: string = (browserLocale || '').split('-')[0]

const defaultLocale: Locales = Object.values(Locales).includes(browserShortLocale as Locales)
  ? browserShortLocale as Locales
  : Locales.EN

export {
  LOCALES_CONFIG,
  Locales,
  defaultLocale,
  browserLocale
}

export default new VueI18n({
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    [Locales.EN]: en,
  }
})
