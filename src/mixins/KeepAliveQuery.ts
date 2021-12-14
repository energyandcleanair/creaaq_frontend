import {VueClass} from '@vue/test-utils'
import {Component, Vue} from 'vue-property-decorator'
import {NavigationGuardNext, Route} from 'vue-router'
import {isObjEmpty} from '@/utils'

type RouteQuery = Record<string, any>
interface IKeepAliveQueryMixin extends Vue {
  isKeepAliveInactive: boolean
}

export default function mixinConstructor(params?: {
  beforeRestoreURLQuery?: (
    vm: Vue,
    cachedQuery: RouteQuery | null
  ) => void | RouteQuery | Promise<RouteQuery>
}): VueClass<IKeepAliveQueryMixin> {
  /**
   * Mixin that caches the URL query before leaving the route
   * and applies it back when the component is active again.
   * It helps to save the URL query in navigating between
   * "keep-alive" views/pages that have own URL query.
   **/
  return Component(
    class KeepAliveQueryMixin extends Vue {
      public isKeepAliveInactive: boolean = true

      private keepAliveQueryCache: {
        query: RouteQuery | null
      } = {
        query: null,
      }

      public hasCachedQuery(): boolean {
        return !isObjEmpty(this.$route.query)
      }

      public async activated() {
        if (!this.$route.query || isObjEmpty(this.$route.query)) {
          try {
            await this._restoreQuery()
          } catch (err) {
            console.error(err)
          }
        }
        this.isKeepAliveInactive = false
      }

      public async beforeRouteLeave(
        _: any,
        __: any,
        next: NavigationGuardNext
      ) {
        try {
          await this._cacheQuery()
        } catch (err) {
          console.error(err)
        }
        this.isKeepAliveInactive = true
        next()
      }

      public async _cacheQuery() {
        this.keepAliveQueryCache.query = this.$route.query
      }

      public async _restoreQuery() {
        let cachedQuery = this.keepAliveQueryCache.query

        if (params?.beforeRestoreURLQuery) {
          const updatedQuery = await params.beforeRestoreURLQuery.call(
            this,
            this,
            cachedQuery
          )
          if (updatedQuery) cachedQuery = updatedQuery
        }

        const newRoute: Route = this.$router.resolve({
          ...(this.$route as any),
          query: cachedQuery,
        }).resolved

        if (this.$route.fullPath !== newRoute.fullPath) {
          await this.$router.replace(newRoute.fullPath)
        }

        if (typeof (this as any).onAfterCachedQueryRestored === 'function') {
          ;(this as any).onAfterCachedQueryRestored.call(this)
        }
      }
    }
  )
}
