<template>
  <v-container class="map-chart" fluid>
    <div
      v-if="isLoading"
      class="map-chart__loader d-flex justify-center align-center"
    >
      <v-progress-circular indeterminate color="primary" size="80" />
    </div>

    <!-- TODO: not in use -->
    <!-- <div
      v-if="!isLoading && !entities.length"
      class="map-chart__message-banner pa-12"
    >
      <v-alert class="fill-width text-center ma-0" color="info lighten-3">
        {{ $t('msg.no_data') }}
      </v-alert>
    </div> -->

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
          :attribution="MAP_LAYERS.TERRAIN.attribution"
        />

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
  </v-container>
</template>

<script lang="ts">
import 'leaflet/dist/leaflet.css'
import moment from 'moment'
import _set from 'lodash.set'
import _debounce from 'lodash.debounce'
import _orderBy from 'lodash.orderby'
import Leaflet, {LatLngBounds, Layer} from 'leaflet'
import {Component, Vue, Prop, Ref, Watch} from 'vue-property-decorator'
import {LMap, LTileLayer, LCircleMarker, LLayerGroup} from 'vue2-leaflet'
import config, {ConfigParams} from '@/config'
import {mdiArrowExpandAll} from '@mdi/js'
import theme from '@/theme'
import City from '@/entities/City'
import Station from '@/entities/Station'
import Source from '@/entities/Source'
import Coordinates from '@/entities/Coordinates'
import {sleep, _runIteration} from '@/utils'
import Pollutant from '@/entities/Pollutant'
import URLQuery, {MapChartBasemap, MapChartLevel} from '../../types/URLQuery'
import ChartData from './MapChartData'
import MapMarkerPopup from './MapMarkerPopup.vue'

interface MapMarker {
  id: City['id'] | Station['id']
  coordinates: number[] // lat, lng
  station?: Station
  city?: City
  genLeafletMarker?: () => Leaflet.Layer
}

interface MapFilter {
  [id: string]: number
}

// hot fix
interface MapLayer extends Leaflet.Layer {
  options: Leaflet.LayerOptions & {_id: any; _type: 'marker'}
  _popup?: any
}

@Component({
  components: {
    LMap,
    LTileLayer,
    LCircleMarker,
    LLayerGroup,
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

  @Prop({type: Boolean, default: false})
  public readonly frozen!: boolean

  public privateIsLoading: boolean = false
  public mapMarkersList: Record<string, MapMarker> = {}
  public mdiArrowExpandAll = mdiArrowExpandAll

  public get isLoading(): boolean {
    return this.loading || this.privateIsLoading
  }
  public set isLoading(val: boolean) {
    this.privateIsLoading = val
  }

  public get basemap(): MapChartBasemap {
    return this.queryParams?.basemap || MapChartBasemap.terrain
  }

  public get MAP_LAYERS(): ConfigParams['MAP_LAYERS'] {
    return config.get('MAP_LAYERS')
  }

  public get cities(): City[] {
    return this.chartData.cities || []
  }

  public get stations(): Station[] {
    return this.chartData.stations || []
  }

  public get entities(): (City | Station)[] {
    return [...this.chartData.cities, ...this.chartData.stations]
  }

  public get mapOptions(): Leaflet.MapOptions {
    let firstMarkerId
    for (firstMarkerId in this.mapMarkersList) break
    const firstMarker = (firstMarkerId &&
      this.mapMarkersList[firstMarkerId]) as MapMarker | undefined

    return {
      zoom: 2,
      closePopupOnClick: false,
      preferCanvas: true,
      doubleClickZoom: 'center',
      center: new Leaflet.LatLng(
        firstMarker?.coordinates?.[0] || 0,
        firstMarker?.coordinates?.[1] || 0
      ),
    }
  }

  public get chartPollutantsMap(): {[pollutantId: string]: Pollutant} {
    return this.chartData.pollutants.reduce(
      (memo: {[pollutantId: string]: Pollutant}, item) => {
        if (!memo[item.id]) memo[item.id] = item
        return memo
      },
      {}
    )
  }

  public get chartSourcesMap(): {[sourceId: string]: Source} {
    return this.chartData.sources.reduce(
      (memo: {[sourceId: string]: Source}, item) => {
        if (!memo[item.id]) memo[item.id] = item
        return memo
      },
      {}
    )
  }

  public mounted() {
    // see this.onMapInitialized()
  }

  public async onMapInitialized() {
    if (this.frozen) return
    this.refreshMapMarkers()
  }

  @Watch('queryParams.pollutants')
  public onFilterChanged(newVal: string[], oldVal: string[]) {
    if (this.frozen) return
    const val1 = newVal?.join(',')
    const val2 = oldVal?.join(',')
    if (val1 !== val2) this.refreshMapMarkers()
  }

  public get refreshMapMarkers() {
    return _debounce(async () => {
      if (this.frozen) return
      this.isLoading = true

      // let the loader appear
      await sleep(10)

      const {list, length} = this.getMapMarkersList()
      this.mapMarkersList = list

      if (
        this.queryParams.level === MapChartLevel.station &&
        !this.queryParams.sources?.length
      ) {
        this.$dialog.notify.info(
          this.$t('msg.no_items_selected', {
            items: this.$t('sources').toString().toLowerCase(),
          }).toString(),
          {position: 'bottom-left', timeout: 3000, dismissible: false}
        )
      } else if (!this.queryParams.pollutants?.length) {
        this.$dialog.notify.info(
          this.$t('msg.no_items_selected', {
            items: this.$t('pollutants').toString().toLowerCase(),
          }).toString(),
          {position: 'bottom-left', timeout: 3000, dismissible: false}
        )
      }

      this.$dialog.notify.info(
        this.$t('msg.rendering_n_items', {n: length}) + '...',
        {position: 'bottom-left', timeout: 3000, dismissible: false}
      )

      // let the message above appear
      await sleep(10)

      if (this.$map?.mapObject) {
        const renderedMarkersIds: Record<string, number> = {}

        // remove unnecessary markers
        this.$map.mapObject.eachLayer((layer: any) => {
          const opts = layer.options
          if (opts?.pane !== 'markerPane' || opts._type !== 'marker') return
          const markerId = opts._id
          if (this.mapMarkersList[markerId]) renderedMarkersIds[markerId] = 1
          else layer.remove()
        })

        // draw new markers
        for (const markerId in this.mapMarkersList) {
          if (renderedMarkersIds[markerId]) continue
          const marker = this.mapMarkersList[markerId]
          const lMarker = marker.genLeafletMarker?.()
          if (lMarker) this.$map.mapObject.addLayer(lMarker)
        }
      }

      await sleep(10)

      this.fitAllMarkers()
      this.$emit('markers:added')
      this.isLoading = false
    }, 1000)
  }

  public getMapMarkersList(): {
    list: Record<string, MapMarker>
    length: number
  } {
    let length: number = 0
    let list: Record<string, MapMarker> = {}
    const cities = this.chartData.cities
    const stations = this.chartData.stations

    let filterPollutants: MapFilter | null = (
      this.queryParams.pollutants || []
    ).reduce(
      (memo: MapFilter, id: Pollutant['id']) => (memo[id] = 1) && memo,
      {}
    )
    if (!Object.keys(filterPollutants).length) filterPollutants = null

    let filterSources: MapFilter | null = null
    if (this.queryParams.level === MapChartLevel.station) {
      filterSources = (this.queryParams.sources || []).reduce(
        (memo: MapFilter, id: Source['id']) => (memo[id] = 1) && memo,
        {}
      )
      if (!Object.keys(filterSources).length) filterPollutants = null
    }

    const filterCb = (item: City | Station | null): boolean => {
      if (!item || !filterPollutants) return false
      const sourceId = (item as Station).source
      if (sourceId) {
        if (!_valuePassesFilter(sourceId, filterSources)) return false
      }
      for (const pollutantId of item.pollutants || []) {
        if (!_valuePassesFilter(pollutantId, filterPollutants)) return false
      }
      return true
    }

    const _generateMarkersList = (
      mapChartLevel: MapChartLevel,
      items: (City | Station)[]
    ) => {
      return items.reduce(
        (memo: Record<string, MapMarker>, item: City | Station) => {
          if (!filterCb(item)) return memo
          const marker = this._genMarker(mapChartLevel, item)
          if (marker) {
            memo[marker.id] = marker
            length++
          }
          return memo
        },
        {}
      )
    }

    if (this.queryParams.level === MapChartLevel.city) {
      list = _generateMarkersList(MapChartLevel.city, cities)
    } else if (this.queryParams.level === MapChartLevel.station) {
      list = _generateMarkersList(MapChartLevel.station, stations)
    }

    return {
      list,
      length,
    }
  }

  public _genMarker(
    type: MapChartLevel,
    item: City | Station
  ): MapMarker | null {
    if (!item) return null

    let coordinates: Coordinates | undefined
    if (type === MapChartLevel.city) coordinates = (item as City).geometry
    if (type === MapChartLevel.station) {
      coordinates = (item as Station).coordinates
    }
    if (!coordinates) return null

    const marker: MapMarker = {
      id: item.id,
      [type]: item,
      coordinates: [coordinates.latitude, coordinates.longitude],
      genLeafletMarker: undefined,
    }

    marker.genLeafletMarker = () => {
      const _openMarkerPopup = ({target}: {target: Leaflet.CircleMarker}) => {
        const detailsList: Record<string, any> = {}
        if (item.last_updated) {
          detailsList['' + this.$t('last_updated')] = moment(
            item.last_updated
          ).format('DD MMMM YYYY')
        }
        if (Array.isArray(item.pollutants)) {
          const pollutantsStr = item.pollutants
            .reduce((arr: string[], id) => {
              const pollutant = this.chartPollutantsMap[id]
              if (pollutant) arr.push(pollutant.name)
              return arr
            }, [])
            .join(', ')
          detailsList['' + this.$t('pollutants')] = pollutantsStr
        }

        const itemSourcesSet = new Set<string>()
        if ((item as City).sources) {
          ;(item as City).sources?.forEach((srcId) => itemSourcesSet.add(srcId))
        }
        if ((item as Station).source) {
          itemSourcesSet.add((item as Station).source as string)
        }

        const sourcesStr = Array.from(itemSourcesSet)
          .reduce((arr: string[], id) => {
            const source = this.chartSourcesMap[id]
            if (source) arr.push(source.short_name || source.name || source.id)
            return arr
          }, [])
          .join(', ')

        if (sourcesStr) {
          detailsList[
            (item as Station).level === 'station'
              ? this.$t('source').toString()
              : this.$t('sources').toString()
          ] = sourcesStr
        }

        const popupComponent = new MapMarkerPopup({
          propsData: {
            title: item.name,
            detailsList,
          },
          i18n: this.$i18n,
        })
        popupComponent.$on('click:button', () => {
          this.$emit('click:markerAction', marker.city || marker.station)
          target.closePopup?.()
        })
        popupComponent.$mount()

        if (!target.getPopup?.() && popupComponent.$el) {
          const popup = Leaflet.popup({
            pane: 'popupPane',
            className: 'custom-map-marker-popup',
            autoPan: true,
            offset: [0, 0],
          })
            .setContent(popupComponent.$el as HTMLElement)
            .on('add', () => {
              target.setStyle(theme.leafletMapCircleMarkerProps.primarySelected)
            })
            .on('remove', () => {
              target.setStyle(theme.leafletMapCircleMarkerProps.primary)
            })
          target.bindPopup(popup)
        }

        target.openPopup()
      }

      const circleMarker = Leaflet.circleMarker(
        marker.coordinates as Leaflet.LatLngExpression,
        {
          pane: 'markerPane',
          _id: marker.id,
          _type: 'marker',
          ...theme.leafletMapCircleMarkerProps.primary,
        } as Leaflet.CircleMarkerOptions
      ).on('click', ($event: {target: Leaflet.CircleMarker}) => {
        _openMarkerPopup($event)
      })

      return circleMarker
    }

    return marker
  }

  public fitAllMarkers() {
    if (!this.$map?.mapObject) return

    const markers: Leaflet.Layer[] = []
    this.$map.mapObject.eachLayer((layer: any) => {
      const opts = layer.options
      if (opts?.pane !== 'markerPane' || opts._type !== 'marker') return
      markers.push(layer)
    })

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

  public mapMoveToStation(stationId: Station['id']) {
    const marker = this.mapMarkersList[stationId]
    if (!marker) return

    this.moveToPoint({
      latitude: marker.coordinates?.[0] || 0,
      longitude: marker.coordinates?.[1] || 0,
    })
  }

  public mapMoveToCity(cityId: City['id']) {
    const marker = this.mapMarkersList[cityId]
    if (!marker) return

    this.moveToPoint({
      latitude: marker.coordinates?.[0] || 0,
      longitude: marker.coordinates?.[1] || 0,
    })
  }

  public closeAllMapMarkerPopups() {
    this.$map?.mapObject?.eachLayer((layer: any) => {
      if (layer.options?.pane === 'popupPane' && this.$map?.mapObject) {
        layer.removeFrom(this.$map.mapObject)
      }
    })
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

  &__message-banner {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &:before {
      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      background: var(--v-grey-lighten5);
      opacity: 0.7;
    }
  }

  &__content {
    .vue2leaflet-map {
      z-index: 1;
      width: 100%;
      min-height: 100%;
      border-radius: 0;

      .custom-map-marker-popup {
        .leaflet-popup-content-wrapper {
          position: relative;
          z-index: 2;

          .leaflet-popup-content {
            margin: 0;
          }
        }

        .leaflet-popup-tip-container {
          z-index: 2;
        }

        .leaflet-popup-close-button {
          z-index: 3;
        }
      }
    }
  }
}
</style>
