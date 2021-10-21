<template>
  <v-container
    class="map-chart"
    fluid
  >
    <div
      v-if="isLoading"
      class="map-chart__loader d-flex justify-center align-center"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="80"
      />
    </div>

    <template v-if="!isLoading && !entities.length">
      <v-alert
        class="fill-width text-center ma-12"
        color="grey lighten-3"
      >
        {{ $t('msg.no_data') }}
      </v-alert>
    </template>

    <template v-else>
      <div class="map-chart__content fill-width fill-height">
        <l-map
          ref="map"
          class="elevation-1"
          :options="mapOptions"
          @ready="onMapInitialized"
        >
          <l-tile-layer
            v-if="basemap === 'satellite'"
            :url="MAP_LAYERS.SATELLITE.url"
            :attribution="MAP_LAYERS.SATELLITE.attribution"
          />
          <l-tile-layer
            v-else
            :url="MAP_LAYERS.TERRAIN.url"
          />

          <v-marker-cluster>
            <template v-for="markers of mapMarkersChunks">
              <l-circle-marker
                :ref="`marker--${marker.id}`"
                v-for="marker of markers"
                :key="marker.id"
                :lat-lng="marker.coordinates"
                rise-on-hover
                v-bind="selectedMarkersIdsMap[marker.id] ? iconSelected : iconPrimary"
                @click="onClickMapMarker(marker.id)"
              >
                <l-popup
                  v-if="marker.tooltip"
                  :class="{'tooltip--selected': selectedMarkersIdsMap[marker.id]}"
                  :options="{
                permanent: true,
                interactive: true,
                direction: 'top',
                offset: {x: 0, y: 0}
              }"
                >
                  <b class="text-title font-weight-bold">
                    {{ marker.tooltip.title }}
                  </b>

                  <div class="mt-3">
                    <div
                      class="text-body-2"
                      v-for="(val, key) of marker.tooltip.params"
                      :key="key"
                    >
                      <b>{{key}}:</b> {{ val }}
                    </div>
                  </div>

                  <v-btn
                    class="mt-3"
                    color="primary"
                    block
                    depressed
                    dense
                    @click="onClickMarkerTooltipButton(marker)"
                  >
                    {{ $t('go_to_measurements') }}
                  </v-btn>
                </l-popup>
              </l-circle-marker>
            </template>
          </v-marker-cluster>

          <div class="leaflet-bottom leaflet-left">
            <v-btn
              class="leaflet-control"
              icon
              :rounded="false"
              @click="fitAllMarkers()"
            >
              <v-icon>{{ mdiArrowExpandAll }}</v-icon>
            </v-btn>
          </div>
        </l-map>
      </div>
    </template>
  </v-container>
</template>

<script lang="ts">
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import _set from 'lodash.set'
import _debounce from 'lodash.debounce'
import _orderBy from 'lodash.orderby'
import Leaflet, {LatLngBounds} from 'leaflet'
import {Component, Vue, Prop, Ref, Watch} from 'vue-property-decorator'
import {LMap, LTileLayer, LCircleMarker, LTooltip, LPopup} from 'vue2-leaflet'
import moment from 'moment'
import Vue2LeafletMarkerCluster from 'vue2-leaflet-markercluster'
import config, {MapLayerConfig} from '@/config'
import {mdiArrowExpandAll} from '@mdi/js'
import theme from '@/theme'
import City from '@/entities/City'
import Station from '@/entities/Station'
import Coordinates from '@/entities/Coordinates'
import {sleep, _runIteration} from '@/utils'
import Pollutant from '@/entities/Pollutant'
import URLQuery, {MapChartBasemap} from '../../types/URLQuery'
import ChartData from './MapChartData'

interface MapMarker {
  id: City['id'] | Station['id']
  coordinates: number[]
  station?: Station
  city?: City
  tooltip?: {
    title: string
    params: Record<string, any>
  }
}

interface MapFilter {
  [id: string]: number
}

@Component({
  components: {
    LMap,
    LTileLayer,
    LCircleMarker,
    LTooltip,
    LPopup,
    'v-marker-cluster': Vue2LeafletMarkerCluster,
  },
})
export default class MapChart extends Vue {
  @Ref('map')
  readonly $map?: LMap

  @Ref('table')
  readonly $table?: any

  @Prop({type: Object, required: true})
  readonly queryParams!: URLQuery

  @Prop({type: Object, required: true})
  readonly chartData!: ChartData

  @Prop({type: Boolean, default: false})
  public readonly loading!: boolean

  @Prop({type: Boolean, default: false})
  public readonly permanentTooltipOnSelected!: boolean

  private privateisLoading: boolean = false
  private mapMarkers: MapMarker[] = []
  private mapMarkersChunks: MapMarker[][] = []
  private mdiArrowExpandAll = mdiArrowExpandAll
  private iconPrimary = theme.leafletMapCircleMarkerProps.primary
  private iconSelected = theme.leafletMapCircleMarkerProps.primarySelected
  private tableOptions = {
    page: 1,
    itemsPerPage: 5,
    sortBy: ['id'],
    sortDesc: [false],
  }

  private get isLoading(): boolean {
    return this.loading || this.privateisLoading
  }
  private set isLoading(val: boolean) {
    this.privateisLoading = val
  }

  private get basemap(): MapChartBasemap {
    return this.queryParams?.basemap || MapChartBasemap.terrain
  }

  private get MAP_LAYERS(): MapLayerConfig {
    return config.get('MAP_LAYERS')
  }

  private get selectedMarkersIds(): (Station['id'] | City['id'])[] {
    return [
      ...(this.queryParams.cities || []),
      ...(this.queryParams.stations || []),
    ]
  }
  // TODO: complete
  private set selectedMarkersIds(stations: Station['id'][]) {
    // this.$emit('update:queryParams', {
    //   ...this.queryParams,
    //   stations,
    // })
  }
  private get selectedMarkersIdsMap(): Record<
    Station['id'] | City['id'],
    number
  > {
    return this.selectedMarkersIds.reduce(
      (
        map: Record<Station['id'] | City['id'], number>,
        id: Station['id'] | City['id']
      ) => {
        map[id] = 1
        return map
      },
      {}
    )
  }

  private get cities(): City[] {
    return this.chartData.cities || []
  }

  private get stations(): Station[] {
    return this.chartData.stations || []
  }

  private get entities(): (City | Station)[] {
    return [...this.chartData.cities, ...this.chartData.stations]
  }

  private get mapOptions(): Leaflet.MapOptions {
    const firstMarker = this.mapMarkers[0]
    return {
      zoom: 2,
      closePopupOnClick: false,
      doubleClickZoom: 'center',
      center: new Leaflet.LatLng(
        firstMarker?.coordinates?.[0] || 0,
        firstMarker?.coordinates?.[1] || 0
      ),
    }
  }

  private mounted() {
    // see this.onMapInitialized()
  }

  private async onMapInitialized() {
    this.refreshMapMarkers()

    // move to the selected station if exists
    // if (this.selectedMarkersIds.length) {
    //   this.mapMoveToStation(this.selectedMarkersIds[0])
    //   this.selectStation(this.selectedMarkersIds[0])
    // }
  }

  @Watch('queryParams.pollutants')
  private onFilterChanged(newVal: string[], oldVal: string[]) {
    const val1 = newVal?.join(',')
    const val2 = oldVal?.join(',')
    if (val1 !== val2) this.refreshMapMarkers()
  }

  public get refreshMapMarkers() {
    return _debounce(async () => {
      this.isLoading = true
      this.mapMarkers = []
      this.mapMarkersChunks = []
      const markers = this.getMapMarkers()

      this.$dialog.message.info(
        this.$t('msg.rendering_n_items', {n: markers.length}) + '...',
        {position: 'bottom-left', timeout: 3000}
      )

      // let the message above appear
      await sleep(50)

      const firstChunkSize = 500
      const chunk1 = markers.slice(0, firstChunkSize)
      this.mapMarkersChunks.push(chunk1)

      setTimeout(() => {
        this.fitAllMarkers()
        const chunk2 = markers.slice(firstChunkSize)
        this.mapMarkersChunks.push(chunk2)

        setTimeout(() => this.fitAllMarkers(), 100)
        this.$emit('markers:added')
        this.isLoading = false
      }, 10)

      // TODO: not in use. It's slower in 1.5 times than the solution above
      // const chunkSize = 3000
      // const numTimes = markers.length / chunkSize
      // const delay = 10
      // await _runIteration(
      //   (index: number) => {
      //     const _markers = markers.slice(
      //       index * chunkSize,
      //       index * chunkSize + chunkSize
      //     )
      //     this.mapMarkersChunks.push(_markers)
      //     if (index === 0 || index % 3 === 0) this.fitAllMarkers()
      //   },
      //   numTimes,
      //   delay
      // )
      // setTimeout(() => this.fitAllMarkers(), 100)
      // this.$emit('markers:added')
      // this.isLoading = false
    }, 1000)
  }

  private selectStation(stationId: Station['id']) {
    // this.selectedMarkersIds = stationId ? [stationId] : []
    // this.closeAllMapMarkerTooltips()
    // this.openMapMarkerTooltip(stationId)
  }

  private getMapMarkers(): MapMarker[] {
    const cities = this.chartData.cities
    const stations = this.chartData.stations

    let filterPollutants: MapFilter | null = (
      this.queryParams.pollutants || []
    ).reduce(
      (memo: MapFilter, id: Pollutant['id']) => (memo[id] = 1) && memo,
      {}
    )
    if (!Object.keys(filterPollutants).length) filterPollutants = null

    const filterCb = (item: City | Station | null): boolean => {
      if (!item || !filterPollutants) return false
      for (const pollutantId of item.pollutants || []) {
        if (!_valuePassesFilter(pollutantId, filterPollutants)) return false
      }
      return true
    }

    if (this.queryParams.level === 'city') {
      return cities
        .filter(filterCb)
        .map((itm) => this._genMarker('city', itm)) as MapMarker[]
    } else if (this.queryParams.level === 'station') {
      return stations
        .filter(filterCb)
        .map((itm) => this._genMarker('station', itm)) as MapMarker[]
    } else {
      return []
    }
  }

  private _genMarker(
    type: 'city' | 'station',
    item: City | Station
  ): MapMarker | null {
    if (!item) return null

    let coordinates: Coordinates | undefined

    if (type === 'city') coordinates = (item as City).geometry
    if (type === 'station') coordinates = (item as Station).coordinates

    if (!coordinates) return null

    const tooltipParams: any = {}

    if (item.last_updated) {
      tooltipParams['' + this.$t('last_updated')] = moment(
        item.last_updated
      ).format('DD MMMM YYYY')
    }
    if (Array.isArray(item.pollutants)) {
      tooltipParams['' + this.$t('pollutants')] = item.pollutants
        .join(', ')
        .toUpperCase()
    }
    if ((item as Station).source) {
      tooltipParams['' + this.$t('source')] = (
        item as Station
      ).source?.toUpperCase()
    }

    const marker: MapMarker = {
      id: item.id,
      [type]: item,
      coordinates: [coordinates.latitude, coordinates.longitude],
      tooltip: {
        title: item.name,
        params: tooltipParams,
      },
    }

    return marker
  }

  public fitAllMarkers() {
    const markers = this.mapMarkers.map((marker) =>
      Leaflet.marker([marker.coordinates[0], marker.coordinates[1]])
    )

    const group = Leaflet.featureGroup(markers)
    const bounds = group.getBounds()
    if (bounds.isValid()) {
      this.$map?.fitBounds(group.getBounds() as LatLngBounds)
    }
  }

  public moveToPoint(coords: Coordinates) {
    if (!coords.longitude && !coords.latitude) return
    const latLng = new Leaflet.LatLng(
      coords.latitude || 0,
      coords.longitude || 0
    )
    const bounds: LatLngBounds = latLng.toBounds(1000) as LatLngBounds // meters
    this.$map?.mapObject?.panTo(latLng)
    this.$map?.mapObject?.fitBounds(bounds)
  }

  private mapMoveToStation(stationId: Station['id']) {
    const marker = this.mapMarkers.find((m) => m.station?.id === stationId)
    if (!marker) return

    this.moveToPoint({
      latitude: marker.coordinates?.[0] || 0,
      longitude: marker.coordinates?.[1] || 0,
    })
  }

  private mapMoveToCity(cityId: City['id']) {
    const marker = this.mapMarkers.find((m) => m.city?.id === cityId)
    if (!marker) return

    this.moveToPoint({
      latitude: marker.coordinates?.[0] || 0,
      longitude: marker.coordinates?.[1] || 0,
    })
  }

  private openMapMarkerTooltip(stationId: Station['id']) {
    if (!stationId) return
    if (!this.$map?.mapObject) return

    const $refs = this.$refs[`marker--${stationId}`] as LCircleMarker[]
    const $marker = $refs?.[0]?.mapObject
    if (!$marker) return

    $marker.openTooltip()
  }

  private closeAllMapMarkerTooltips() {
    this.$map?.mapObject?.eachLayer((layer: Leaflet.Layer) => {
      if (
        (layer as any).options.pane === 'tooltipPane' &&
        this.$map?.mapObject
      ) {
        layer.removeFrom(this.$map.mapObject)
      }
    })
  }

  private onClickMarkerTooltipButton(marker: MapMarker) {
    this.$emit('click:markerAction', marker.city || marker.station)
  }

  private onClickMapMarker(stationId: Station['id']) {
    this.selectStation(stationId)
    this.openMapMarkerTooltip(stationId)
  }

  private onClickTableRow(station: Station) {
    this.selectStation(station.id)
    this.mapMoveToStation(station.id)
  }
}

function _valuePassesFilter(
  filterKey: any,
  filterMap: MapFilter | null
): boolean {
  return !filterMap || (filterKey && filterMap[filterKey])
}
</script>

<style lang="scss">
$map-chart__content--min-height: 450px;
$map-chart__table-footer--height: 59px;

.map-chart {
  padding: 0;
  position: relative;

  &__loader {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #ffffff5e;
    z-index: 10;
  }

  &__content {
    .vue2leaflet-map {
      z-index: 1;
      width: 100%;
      min-height: 100%;
      border-radius: 0;

      .leaflet-tooltip {
        // the pseudo selector :has() isn't supported yet, but soon
        &:has(.tooltip--selected) {
          z-index: 100;
        }
      }
    }
  }
}
</style>