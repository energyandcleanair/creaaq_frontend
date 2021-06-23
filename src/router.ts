import Vue from 'vue'
import _get from 'lodash.get'
import VueRouter, { RouteConfig } from 'vue-router'
// import { auth } from '@/plugins/firebase'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/Home.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    name: 'auth',
    path: '/auth',
    component: () => import('@/views/auth/Auth.vue'),
    meta: {
      requiresAuth: false
    },
    beforeEnter (to, from, next) {
      const AUTH_ROUTES: string[] = (_get(
          routes.find((r: RouteConfig) => r.name === 'auth'),
          'children',
          []
        ) as RouteConfig[])
        .map((r: RouteConfig) => r.name || 'unknown')

      if (Vue.auth.currentUser && to.name === 'changePassword') next()
      else if (Vue.auth.currentUser) next({name: 'home'})
      else if (!AUTH_ROUTES.includes(to.name || '')) next({name: 'signIn'})
      else next()
    },
    children: [
      {
        name: 'signIn',
        path: 'signin'
      },
      {
        name: 'signUp',
        path: 'signup'
      },
      {
        name: 'resetPassword',
        path: 'reset-password'
      },
      {
        name: 'resetPasswordMessage',
        path: 'reset-password-done'
      },
      {
        name: 'changePassword',
        path: 'change-password'
      },
      {
        path: '*'
      }
    ]
  },
  {
    path: '/measurements',
    name: 'measurements',
    component: () => import(/* webpackChunkName: "measurements" */ '@/views/measurements/Measurements.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import(/* webpackChunkName: "profile" */ '@/views/profile/Profile.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '*',
    redirect: '/',
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL || '/',
  routes
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(x => x.meta.requiresAuth)

  if (requiresAuth) {
    if (!Vue.auth.currentUser) await Vue.auth.onInitialized()
    if (!Vue.auth.currentUser) return next({name: 'signIn'})
  }

  next()
})


export default router