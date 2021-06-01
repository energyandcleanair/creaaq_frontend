import dot from 'dot-object'
import { Locales } from './Locales'

const dictionaries = Object
  .values(Locales)
  .map(locale => ({
    locale,
    messages: dot.dot(require(`./${locale}`).default)
  }))

describe('Test i18n dictionaries', () => {
  test('there should be no missing keys', (done) => {
    for (const dic0 of dictionaries) {
      for (const dic1 of dictionaries) {
        for (const key in dic0.messages) {
          if (!Object.prototype.hasOwnProperty.call(dic1.messages, key)) {
            return done(`Key '${key}' is missed in the locale '${dic1.locale}' (compared with '${dic0.locale}')`)
          }
        }
      }
    }
    done()
  })
})
