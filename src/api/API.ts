// import Vue from 'vue'
import _get from 'lodash.get'
import axios from 'axios'
import config from '@/config'
// import router from '@/router'

const instance = axios.create({
  baseURL: config.value('API_ORIGIN'),
  withCredentials: true
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