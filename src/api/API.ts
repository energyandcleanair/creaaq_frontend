import _get from 'lodash.get'
import localForage from 'localforage'
import {setup} from 'axios-cache-adapter'
import {
  auth,
  refreshAccessToken,
  getAccessToken,
  getUserUID,
} from '@/plugins/firebase'
import config from '@/config'
import router from '@/router'
import {getCookie} from '@/utils'

export const forageStore = localForage.createInstance({
  driver: [localForage.INDEXEDDB, localForage.LOCALSTORAGE],
  name: 'crea-cache',
})

const instance = setup({
  baseURL: config.get('NODE_ENV') === 'development' ? 'api'
  : new URL(config.get('API_ORIGIN') || '')
    .toString()
    .replace(/\/$/, ''),
  withCredentials: true,
  timeout: 60000,

  // `axios-cache-adapter` options
  cache: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hrs
    store: forageStore,
    exclude: {
      methods: ['post', 'patch', 'put', 'delete'],
      query: false, // Exclude requests with query parameters.
    },
  },
})

instance.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) config.headers['Authorization'] = token
    const userUID = getUserUID()
    if (userUID) config.headers['user-id'] = userUID
    const gAnalyticsClientId = getCookie('_ga')
    if (gAnalyticsClientId) config.headers['ga-client-id'] = gAnalyticsClientId
    return config
  },
  (error) => {
    console.error(error)
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (res) => res,
  async ({response: res}) => {
    if (!res) return res

    let message = ''
    if (res.status >= 400) {
      message =
        typeof res.data === 'string' ? res.data : _get(res.data, 'message', '')
    }

    if ([401, 403].includes(res.status)) {
      if (getAccessToken()) {
        await refreshAccessToken().catch((err: any) => console.error(err))

        if (getAccessToken()) {
          setTimeout(() => location.reload(), 200)
          return Promise.resolve(res)
        }
      }

      if (res.status === 401 && auth.currentUser) {
        const from: string = router.currentRoute.fullPath
        auth.signOut().then(() =>
          router.push({
            name: 'auth',
            query: {from},
          })
        )
      }
    }

    let result = {message, _raw: res}
    if (typeof res.data === 'object' && res.data) {
      result = {...result, ...res.data}
    }

    return Promise.reject(result)
  }
)

export default instance
