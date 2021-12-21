import {VueClass} from '@vue/test-utils'
import {Component, Vue} from 'vue-property-decorator'
import {NavigationGuardNext, Route} from 'vue-router'

type RouteQuery = Record<string, any>
export interface IKeepAliveQueryMixin extends Vue {
  isKeepAliveInactive: boolean
  cacheCurrentRouteSnapshot: () => string
}
type ComponentMethodName<T> = keyof T

export default function mixinConstructor<T>(params: {
  hooksMap: {
    reload: ComponentMethodName<T>
  }
  // keep some of query params shared, even if the URL query is cached
  sharedQueryGetter?: (vm: T) => RouteQuery | Promise<RouteQuery>
}): VueClass<IKeepAliveQueryMixin> {
  /**
   * Mixin that caches the URL query before leaving the route
   * and applies it back when the component is active again.
   * It helps to save the URL query in navigating between
   * "keep-alive" views/pages that have own URL query.
   **/
  return Component(
    class KeepAliveQueryMixin extends Vue {
      public isKeepAliveInactive: boolean = false
      private cachedRouteSnapshot: string = ''

      private async activated() {
        let isNeedReload: boolean = false
        try {
          isNeedReload = await this.beforeKeepAliveActivated()
        } catch (err) {
          console.error(err)
        }
        this.isKeepAliveInactive = false

        if (isNeedReload == true) {
          if (typeof (this as any)[params?.hooksMap.reload] === 'function') {
            await (this as any)[params?.hooksMap.reload].call(this)
          } else {
            console.error(
              "KeepAliveQueryMixin. The 'reload' function is not defined"
            )
          }
        }
      }

      private async beforeRouteLeave(
        _: any,
        __: any,
        next: NavigationGuardNext
      ) {
        this.isKeepAliveInactive = true
        next()
      }

      private async beforeKeepAliveActivated(): Promise<boolean> {
        const sharedQuery =
          params?.sharedQueryGetter?.call(this, this as any as T) || {}
        let isNeedReload = false
        const isEmptyQuery = this.$route.fullPath === this.$route.path
        const cachedSnapshot = this.getCachedRouteSnapshot()

        if (isEmptyQuery) {
          if (cachedSnapshot) {
            const cachedMergedSnapshot = this.getCachedRouteSnapshot({
              merge: {query: sharedQuery},
            })
            const isEqual = this.checkRouteSnapshotEqualsTo(
              cachedSnapshot,
              cachedMergedSnapshot
            )
            await this.replaceCurrentRouteWithSnapshot(cachedMergedSnapshot)
            if (!isEqual) isNeedReload = true
          } else {
            isNeedReload = true
          }
        } else {
          const isEqual = this.checkRouteSnapshotEqualsTo(
            cachedSnapshot,
            this.takeCurrentRouteSnapshot()
          )
          isNeedReload = !isEqual
        }

        return isNeedReload
      }

      private takeCurrentRouteSnapshot(params?: {
        merge?: {query?: Record<string, any>}
      }): string {
        return this.takeRouteSnapshot(this.$route, params)
      }

      private takeRouteSnapshot(
        route: Route,
        params?: {
          merge?: {query?: Record<string, any>}
        }
      ): string {
        const resultRoute: Route = this.$router.resolve({
          ...(route as any),
          query: {
            ...route.query,
            ...(params?.merge?.query || {}),
          },
        }).resolved
        return resultRoute.fullPath
      }

      public cacheCurrentRouteSnapshot(): string {
        this.cachedRouteSnapshot = this.takeCurrentRouteSnapshot()
        return this.cachedRouteSnapshot
      }

      private getCachedRouteSnapshot(params?: {
        merge?: {query?: Record<string, any>}
      }): string {
        let snapshot = this.cachedRouteSnapshot
        if (params?.merge?.query) {
          const routeSnapshot: Route = this.$router.resolve(snapshot).resolved
          snapshot = this.takeRouteSnapshot(routeSnapshot, {
            merge: params.merge,
          })
        }
        return snapshot
      }

      private checkRouteSnapshotEqualsTo(
        path1: string,
        path2: string
      ): boolean {
        return path1 === path2
      }

      private async replaceCurrentRouteWithSnapshot(snapshot: string) {
        await this.$router.replace(snapshot, undefined, (err) => {
          console.error(err)
        })
      }
    }
  )
}
