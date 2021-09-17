<template>
  <v-container
    class="map-chart"
    fluid
  >
    <template v-if="loading">
      <v-skeleton-loader type="image" />
    </template>

    <template v-else-if="!entities.length">
      <v-alert
        class="text-center ma-12"
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
          <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <l-marker
            :ref="`marker--${marker.id}`"
            v-for="marker of mapMarkers"
            :key="marker.id"
            :lat-lng="marker.coordinates"
            :icon="selectedMarkersIds.includes(marker.id) ? iconSelected : iconPrimary"
            @click="onClickMapMarker(marker.id)"
          >
            <l-tooltip
              :class="{'tooltip--selected': selectedMarkersIds.includes(marker.id)}"
              :options="{
                permanent: permanentTooltipOnSelected,
                interactive: false,
                direction: 'top',
                offset: {x: 0, y: -41}
              }"
            >
              <div class="pb-2">
                <b class="text-body-1 font-weight-bold">
                  <!-- TODO: complete the tooltip details -->
                  {{ marker.station ? marker.station.name : '' }}
                  {{ marker.city ? marker.city.name : '' }}
                </b>
              </div>
            </l-tooltip>
          </l-marker>

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
import _set from 'lodash.set'
import _orderBy from 'lodash.orderby'
import Leaflet, {Icon, LatLngBounds} from 'leaflet'
import {Component, Vue, Prop, Ref} from 'vue-property-decorator'
import {LMap, LTileLayer, LMarker, LTooltip} from 'vue2-leaflet'
import {mdiArrowExpandAll} from '@mdi/js'
import City from '@/entities/City'
import Station from '@/entities/Station'
import URLQuery from '../../types/URLQuery'
import ChartData from './MapChartData'
import Coordinates from '@/entities/Coordinates'

type D = Icon.Default & {_getIconUrl?: string}
delete (Icon.Default.prototype as D)._getIconUrl

Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})

const iconPrimary = new Leaflet.Icon({
  className: 'icon-primary',
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  tooltipAnchor: [1, 0],
  shadowSize: [41, 41],
})

const iconSelected = new Leaflet.Icon({
  className: 'icon-selected',
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  tooltipAnchor: [1, 0],
  shadowSize: [41, 41],
})

interface MapMarker {
  id: City['id'] | Station['id']
  coordinates: number[]
  station?: Station
  city?: City
}

@Component({
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip,
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

  private mdiArrowExpandAll = mdiArrowExpandAll
  private iconPrimary = iconPrimary
  private iconSelected = iconSelected
  private tableOptions = {
    page: 1,
    itemsPerPage: 5,
    sortBy: ['id'],
    sortDesc: [false],
  }

  private get selectedMarkersIds(): Station['id'][] {
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

  private get cities(): City[] {
    return this.chartData.cities || []
  }

  private get stations(): Station[] {
    return this.chartData.stations || []
  }

  private get entities(): (City | Station)[] {
    return [...this.chartData.cities, ...this.chartData.stations]
  }

  // ??
  private get tooltipInfoHeaders(): any[] {
    return []
  }

  private get mapOptions(): Leaflet.MapOptions {
    const firstMarker = this.mapMarkers[0]
    return {
      zoom: 1000,
      closePopupOnClick: false,
      doubleClickZoom: 'center',
      center: new Leaflet.LatLng(
        firstMarker?.coordinates?.[0] || 0,
        firstMarker?.coordinates?.[1] || 0
      ),
    }
  }

  private get mapMarkers(): MapMarker[] {
    const cities = this.chartData.cities
    const stations = this.chartData.stations

    return [
      ...cities.map((itm) => this._genMarker('city', itm)),
      ...stations.map((itm) => this._genMarker('station', itm)),
    ].filter((i) => i) as MapMarker[]
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

    const marker: MapMarker = {
      id: item.id,
      [type]: item,
      coordinates: [coordinates.latitude, coordinates.longitude],
    }

    return marker
  }

  private mounted() {
    // see this.onMapInitialized()
  }

  private onMapInitialized() {
    this.closeAllMapMarkerTooltips()

    // move to the selected station if exists
    // if (this.selectedMarkersIds.length) {
    //   this.mapMoveToStation(this.selectedMarkersIds[0])
    //   this.selectStation(this.selectedMarkersIds[0])
    // }
  }

  private selectStation(stationId: Station['id']) {
    // this.selectedMarkersIds = stationId ? [stationId] : []
    // this.closeAllMapMarkerTooltips()
    // this.openMapMarkerTooltip(stationId)
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

    const $refs = this.$refs[`marker--${stationId}`] as LMarker[]
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

  private onClickMapMarker(stationId: Station['id']) {
    this.selectStation(stationId)
    this.openMapMarkerTooltip(stationId)
  }

  private onClickTableRow(station: Station) {
    this.selectStation(station.id)
    this.mapMoveToStation(station.id)
  }
}
</script>

<style lang="scss">
$map-chart__content--min-height: 450px;
$map-chart__table-footer--height: 59px;

.map-chart {
  padding: 0;

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