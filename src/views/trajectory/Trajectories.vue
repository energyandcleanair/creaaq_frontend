<template>
      <div class="fill-height">
        <div class="trajectory-container">
          <div class="trajectory-filter">
            <v-row>
            <v-col>
              <trajectory-filter :open.sync="isRightPanelOpen" @onFilterChange="handleFilterChange"  />
            </v-col>
          </v-row>
          </div>
          <div class="trajectory-map">
            <v-row class="px-2" style="height: 100%;">
            <v-col style="height: 100%; width: 100%; z-index: 10;">
              <trajectory-map  style="height: 100%" :trajectories="trajectoryMarkers" :selectedDate="dateFrom" />
            </v-col>
          </v-row>
          </div>
        </div>
      </div>
</template>

<script lang="ts">
import {Component, Mixins} from 'vue-property-decorator'
import TrajectoryMap, { TrajectoryLineMarker } from './components/TrajectoryMap.vue';
import TrajectoryFilter from './components/TrajectoryFilters.vue';
import City from '@/entities/City';
import to from 'await-to-js';
import TrajectoryAPI from '@/api/TrajectoryAPI'
import URLQuery, {URLQueryRaw} from './types/URLQuery'
import { toCompactArray } from '@/utils';
import { VueClass } from 'vue-class-component/lib/declarations';
import KeepAliveQueryMixin, {
  IKeepAliveQueryMixin,
} from '@/mixins/KeepAliveQuery'
import { ModuleState } from '@/store';

const keepAliveQueryMixin: VueClass<IKeepAliveQueryMixin> =
  KeepAliveQueryMixin<ViewTrajectories>({
    hooksMap: {
      reload: 'init',
    },
    sharedQueryGetter(vm) {
      const localStorageQuery: ModuleState['queryForm'] | null =
        vm.$store.getters.GET('queryForm') || null

      const sharedQuery: URLQueryRaw = {
        ct: localStorageQuery?.cities || undefined,
      }
      return sharedQuery
    },
  })

@Component({
  name: 'ViewTrajectory',
  components: {
    TrajectoryMap,
    TrajectoryFilter,
  }
})
export default class ViewTrajectories extends Mixins(keepAliveQueryMixin) {
  cities: City[] = [];
  dateFrom?: string
  trajectoryMarkers: TrajectoryLineMarker[] = []

  public handleFilterChange(data: {cities: City[], date: string }) {
    this.cities = data.cities;
    this.dateFrom = data.date;
    console.log(this.cities)
    if (this.cities.length === 0) this.trajectoryMarkers = [];
    if (this.cities.length > 0) {
      console.log("get trajectories")
      this.getTrajectories();
    }  
  }

  public get urlQuery(): URLQuery {
    const q: URLQueryRaw = this.$route.query
    console.log(q);
    return {
      cities: toCompactArray(q.ct),
      dateFrom: q.dateFrom || '',
    }
  }

  public async init() {
    console.log("initialize")
    await to(this.fetch())
    this.cacheCurrentRouteSnapshot()
  }

  public async fetch() {
    await this.setUrlQuery({
      ...this.urlQuery,
    })
  }

  public async setUrlQueryDefaults(): Promise<void> {
    const urlQuery = {...this.urlQuery}

    // set from cache
    if (!urlQuery.cities.length && this.queryFormCached?.cities.length) {
      urlQuery.cities = this.queryFormCached.cities
    }

    await this.setUrlQuery(urlQuery)
  }

  public get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
  }


  public async setUrlQuery(inputQuery: URLQuery): Promise<void> {
    const query: URLQueryRaw = {
      ct: inputQuery.cities,
      dateFrom: inputQuery.dateFrom,
    }

    for (const _key in query) {
      const key: keyof URLQueryRaw = _key as any
      if (!query[key]) delete query[key]
    }

    let newRoute = this.$router.resolve({
      ...(this.$route as any),
      query,
    })

    if ((newRoute.href.length || 0) > 2000) {
      const newHref = newRoute.href.slice(0, 2000).replace(/\&[^&]*$/, '')
      newRoute = this.$router.resolve(newHref)
      this.$dialog.notify.warning(this.$t('msg.too_large_url').toString())
    }

    if (this.$route.fullPath !== newRoute.href) {
      const newRouteQuery: URLQueryRaw = newRoute.route.query
      this.$store.commit('SET', {
        key: 'queryForm.cities',
        value: newRouteQuery.ct,
      })
      await this.$router.replace(newRoute.href, undefined, (err) =>
        console.error(err)
      )
      this.cacheCurrentRouteSnapshot()
    }
  }


  public async getTrajectories() {
    // fetch trajectories with hardcoded date
    const [err, res] = await to(TrajectoryAPI.findAll({ location_id: this.cities, ...this.dateFrom ? { date: this.dateFrom } : {} }));

    // handle error
    if (err) {
      console.error(err);
      return err;
    }

    this.trajectoryMarkers = [];

    for (let trajectory of res!) {
      let markers = trajectory
        .features
        .map((feature): TrajectoryLineMarker => ({
          latLngs: feature.geometry.coordinates.map(v => [v[1], v[0]]),
          color: 'blue'
        }))
      
        this.trajectoryMarkers = [...this.trajectoryMarkers, ...markers];
    }
  }

  public get isRightPanelOpen(): boolean {
    return this.$store.getters.GET('ui.map.isRightPanelOpen')
  }
  
  public set isRightPanelOpen(value: boolean) {
    this.$store.commit('SET', {key: 'ui.map.isRightPanelOpen', value})
  }
}
</script>

<style scoped>
  .trajectory-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .trajectory-map {
    flex: 1;
    position: relative;
  }
</style>