<template>
    <div class="fill-width fill-height">
        <l-map ref="map" :options="mapOptions">
          <l-control-layers position="topright"></l-control-layers>

          <l-tile-layer
            v-for="tileProvider in tileProviders"
              :key="tileProvider.name"
              :name="tileProvider.name"
              :visible="tileProvider.visible"
              :url="tileProvider.url"
              :attribution="tileProvider.attribution"
              layer-type="base"
            />

            <l-wms-tile-layer
              ref="wms"
              :key="wmsLayer.name"
              :base-url="wmsLayer.url"
              :layers="wmsLayer.layers"
              :visible="wmsLayer.visible"
              :name="wmsLayer.name"
              :attribution="wmsLayer.attribution"
              :options="wmsLayer.options"
              :transparent="true"
              format="image/png"
              layer-type="overlay">
            </l-wms-tile-layer>
          <l-polyline v-for="(trajectory, index) in trajectories" :key="index" :lat-lngs="trajectory.latLngs" :color="trajectory.color"></l-polyline>
        </l-map>
    </div>
</template>
  
<script lang="ts">
import 'leaflet/dist/leaflet.css'
import Leaflet, { LatLngExpression, LatLngBounds, map } from 'leaflet'
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { LMap, LTileLayer, LPolyline, LWMSTileLayer, LControlLayers } from 'vue2-leaflet'
import dayjs from "dayjs"

export interface TrajectoryLineMarker {
    latLngs: LatLngExpression[],
    color: string
}

@Component({
components: {
    LMap,
    LTileLayer,
    LPolyline,
    'l-wms-tile-layer': LWMSTileLayer,
    LControlLayers
}
})
export default class TrajectoryMap extends Vue {
    zoom: number = 2
    attribution: string = 'Map data &copy; OpenStreetMap contributors'

    @Ref('map')
    readonly $map?: LMap

    @Ref('wms')
    readonly $wms?: LMap

    @Prop()
    readonly trajectories: TrajectoryLineMarker[] = []

    @Prop()
    readonly selectedDate!: string;

    tileProviders = [
        {
          name: 'OpenStreetMap',
          visible: true,
          attribution:
            '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        },
        {
          name: 'OpenTopoMap',
          visible: false,
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution:
            'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        },
        {
          name: 'Stadia.AlidadeSmoothDark', 
          url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
          visible: false,
          attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ]


    get wmsLayer()  {
      return {
        url: 'https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/b9d8f8ecc608546d20c035b87f1c7ad5/',
        name: 'Active fires',
        visible: true,
        format: 'image/png',
        layers: 'fires_viirs_snpp',
        options: {
          TIME: this.formatSelectedDate(),
        },
        transparent: true,
        attribution: 'NASA EOSDIS Global Imagery Browse Services (GIBS), part of NASA\'s Earth Observing System Data and Information System (EOSDIS).',
      }
    }

    set wmsLayer(value) {
      this.wmsLayer = value
    }

    formatSelectedDate() {
      const dateFrom = dayjs(this.selectedDate).subtract(3, 'day').format('YYYY-MM-DD');
      const dateRange = `${dateFrom}/${this.selectedDate}`
      return dateRange
    }

    

  public get mapOptions(): Leaflet.MapOptions {
    const firstMarker = this.trajectories[0]
    let lat = firstMarker?.latLngs?.[0] as Leaflet.LatLngTuple; 
    let long = firstMarker?.latLngs?.[1] as  Leaflet.LatLngTuple; 
    return {
      zoom: 2,
      closePopupOnClick: false,
      doubleClickZoom: 'center',
      center: new Leaflet.LatLng(lat?.[0] || 0, long?.[0] || 0),
    }
  }

  @Watch("selectedDate")
  onDateChange() {
    // this.wmsLayer = {
    //   ...this.wmsLayer,
    //   options: {
    //     TIME: this.selectedDate,
    //   }
    // }
    // there is an issue with the wmslayer not updating when the options change so we have to do it manually
    if (this.$wms && this.$wms.mapObject) {
      let mapObject = this.$wms.mapObject as any
      mapObject.wmsParams.TIME = this.formatSelectedDate()
    }
  }

  @Watch("trajectories")
  onTrajectoriesChange() {
    this.moveToPoint();
  }


  public moveToPoint() {
    let latestTrajectory = this.trajectories[this.trajectories.length - 1];
    if (latestTrajectory === undefined) return
    let coords = latestTrajectory.latLngs?.[0] as Leaflet.LatLngTuple;
    let lat = coords?.[0];
    let long = coords?.[1];
    if (!long && !lat) return
    const latLng = new Leaflet.LatLng(
      lat || 0,
      long|| 0
    )
    console.log(latLng)
    const bounds: LatLngBounds = latLng.toBounds(1000000) as LatLngBounds // meters
    this.$map?.mapObject?.panTo(latLng)
    this.$map?.mapObject?.fitBounds(bounds)
  }
}
</script>

<style lang="scss">
$right_panel--width: 250px;

.view-map {
  overflow: auto;
  position: unset;

  > .page-content {
    position: relative;
    z-index: 1;
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

  &.right-panel-open {
    width: calc(100% - #{$right_panel--width});
  }
}
</style>
