import _get from 'lodash.get'
import localForage from 'localforage'
import { setup } from 'axios-cache-adapter'
import config from '@/config'

export const forageStore = localForage.createInstance({
  driver: [
    localForage.INDEXEDDB,
    localForage.LOCALSTORAGE,
  ],
  name: 'crea-cache'
})

const instance = setup({
  baseURL: new URL(config.value('API_ORIGIN') || '')
    .toString()
    .replace(/\/$/, ''),
  withCredentials: true,

  // `axios-cache-adapter` options
  cache: {
    maxAge: 15 * 60 * 1000, // 15 mins
    store: forageStore,
    exclude: {
      methods: ['post', 'patch', 'put', 'delete'],
      query: false, // Exclude requests with query parameters.
    }
  }
})

instance.interceptors.response.use(
  (res) => res,
  ({response: res}) => {
    if (!res) return res

    let message = ''
    if (res.status >= 400) {
      message = typeof res.data === 'string'
        ? res.data
        : _get(res.data, 'message', '')
    }

    // TODO: use it later
    // if ([401, 403].includes(res.status)) {
    //   if (res.status === 401 && Vue.auth.currentUser) {
    //     const from: string = router.currentRoute.fullPath
    //     Vue.auth.logout()
    //       .then(() => router.push({
    //         name: 'auth',
    //         query: {from}
    //       }))
    //   }
    // }

    let result = {message, _raw: res}
    if (typeof res.data === 'object' && res.data) {
      result = {...result, ...res.data}
    }

    return Promise.reject(result)
  }
)

export default instance