import Vue from 'vue'
import _get from 'lodash.get'
import _debounce from 'lodash.debounce'
import VueRouter, {RouteConfig} from 'vue-router'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    redirect: {name: 'measurements'},
  },
  {
    name: 'auth',
    path: '/auth',
    component: () => import('@/views/auth/Auth.vue'),
    meta: {
      requiresAuth: false,
    },
    beforeEnter(to, from, next) {
      const AUTH_ROUTES: string[] = (
        _get(
          routes.find((r: RouteConfig) => r.name === 'auth'),
          'children',
          []
        ) as RouteConfig[]
      ).map((r: RouteConfig) => r.name || 'unknown')

      if (Vue.auth.currentUser && to.name === 'changePassword') next()
      else if (Vue.auth.currentUser) next({name: 'home'})
      else if (!AUTH_ROUTES.includes(to.name || '')) next({name: 'signIn'})
      else next()
    },
    children: [
      {
        name: 'signIn',
        path: 'signin',
      },
      {
        name: 'signUp',
        path: 'signup',
      },
      {
        name: 'resetPassword',
        path: 'reset-password',
      },
      {
        name: 'resetPasswordMessage',
        path: 'reset-password-done',
      },
      {
        name: 'changePassword',
        path: 'change-password',
      },
      {
        path: '*',
      },
    ],
  },
  {
    path: '/measurements',
    name: 'measurements',
    component: () =>
      import(
        /* webpackChunkName: "measurements" */ '@/views/measurement/Measurements.vue'
      ),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/violations',
    name: 'violations',
    component: () =>
      import(
        /* webpackChunkName: "violations" */ '@/views/violation/Violations.vue'
      ),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/stations',
    name: 'stations',
    component: () =>
      import(/* webpackChunkName: "stations" */ '@/views/station/Stations.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/map',
    name: 'map',
    component: () =>
      import(/* webpackChunkName: "map" */ '@/views/map/Map.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/trajectories',
    name: 'trajectories',
    component: () =>
      import(/* webpackChunkName: "trajectories" */ '@/views/trajectory/Trajectories.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/tropomi/no2',
    name: 'tropomiNo2',
    component: () =>
      import(
        /* webpackChunkName: "tropomiNo2" */ '@/views/tropomi/TropomiNo2.vue'
      ),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () =>
      import(/* webpackChunkName: "profile" */ '@/views/profile/Profile.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/support',
    name: 'support',
    component: () =>
      import(/* webpackChunkName: "support" */ '@/views/support/Support.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '*',
    redirect: '/',
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL || '/',
  routes,
})

let UPDATE_SERVICE_WORKER_DELAY_MS: number = 1000 * 15 // 15sec
const _updateServiceWorker = _debounce(
  () => {
    const serviceWorker = window.navigator?.serviceWorker
    serviceWorker
      ?.getRegistrations()
      .then((registrationsArray) => registrationsArray[0].update())
  },
  UPDATE_SERVICE_WORKER_DELAY_MS,
  {leading: false, trailing: true}
)

router.beforeEach(async (to, _, next) => {
  _updateServiceWorker()
  const requiresAuth = to.matched.some((x) => x.meta.requiresAuth)
  if (requiresAuth) {
    if (!Vue.auth.currentUser) await Vue.auth.onInitialized()
    if (!Vue.auth.currentUser) return next({name: 'signIn'})
  }

  next()
})

export default router
