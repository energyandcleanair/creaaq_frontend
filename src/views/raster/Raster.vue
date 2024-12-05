<template>
      <div class="fill-height">
        <div class="trajectory-container">
          <div class="trajectory-filter">
            <v-row>
            <v-col>
              <raster-filter :open.sync="isRightPanelOpen" @onFilterChange="handleFilterChange" :selectedRaster="raster" />
            </v-col>
          </v-row>
          </div>
          <div class="trajectory-map">
            <v-row class="px-2" style="height: 100%;">
            <v-col style="height: 100%; width: 100%; z-index: 10;">
              <raster-map  
              style="height: 100%" 
              :metadata="metadata"
              :raster="raster" 
              :center="center"
              :zoom="zoom"
              :selectedLayer="layer"
              @update:center="handleLatLngChange" 
              @update:zoom="handleZoomChange"
              @update:layerSelected="handleLayerChange" />
            </v-col>
          </v-row>
          </div>
        </div>
      </div>
</template>

<script lang="ts">
import {Component, Mixins, Vue} from 'vue-property-decorator'
import RasterMap from './components/RasterMap.vue';
import RasterFilter from './components/RasterFilters.vue';
import City from '@/entities/City';
import to from 'await-to-js';
import TrajectoryAPI from '@/api/TrajectoryAPI'
import {RasterURLQuery} from './types/raster.types'
import { toCompactArray } from '@/utils';
import { VueClass } from 'vue-class-component/lib/declarations';
import KeepAliveQueryMixin, {
  IKeepAliveQueryMixin,
} from '@/mixins/KeepAliveQuery'
import { ModuleState } from '@/store';
import { MetaData } from '@/entities/MetaData';
import { RasterAPI } from '@/api/RasterAPI';
import Raster from '@/entities/Raster';


@Component({
  name: 'RasterView',
  components: {
    RasterMap,
    RasterFilter,
  }
})
export default class RasterView extends Vue {
  raster: string = ''
  center: [ lat: number, lng: number ] = [0,  0]
  zoom: number = 2
  layer: string = ''
  metadata?: MetaData
  readonly rasterApi = new RasterAPI()

  public handleFilterChange(data: {raster: string, meta: MetaData }) {
    this.raster = data.raster
    this.metadata = data.meta
    this.$router.replace({
      query: {
        raster: this.raster,
      },
    })
  }

  public get urlQuery(): RasterURLQuery {
    const q = this.$route.query as unknown as RasterURLQuery
    return {
      raster:q.raster,
    }
  }

  public async mounted() {
    let query = this.$router.currentRoute.query
    this.raster = query.raster as string
    this.center = [parseFloat(query.lat as string) || 0, parseFloat(query.lng as string) || 0]
    this.zoom = parseInt(query.zoom as string) || 2
    this.layer = query.layer as string || ''

    await this.getRasters()
  }

  public async getRasters() {
    this.rasterApi.get_rasters().then((rasters: Raster[]) => {
      let name = (this.raster.split("/").pop())?.split(".")[0]
      this.metadata = rasters.find(r => r.name === name)?.metadata
      this.$forceUpdate()
    })
  }

  public handleLatLngChange(center: { lat: number; lng: number }) {
    this.$router.replace({
      query: {
        ...this.$route.query,
        lat: center.lat.toString(),
        lng: center.lng.toString(),
      },
    })
  }

  public handleZoomChange(zoom: number) {
    this.$router.replace({
      query: {
        ...this.$route.query,
        zoom: zoom.toString(),
      },
    })
  }

  public handleLayerChange(layer: string) {
    this.$router.replace({
      query: {
        ...this.$route.query,
        layer,
      },
    })
  }

  public get queryFormCached(): ModuleState['queryForm'] | null {
    return this.$store.getters.GET('queryForm') || null
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