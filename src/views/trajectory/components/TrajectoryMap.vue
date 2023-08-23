<template>
    <div class="fill-width fill-height">
        <l-map ref="map" :options="mapOptions">
          <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :attribution="attribution"></l-tile-layer>
          <l-polyline v-for="(trajectory, index) in trajectories" :key="index" :lat-lngs="trajectory.latLngs" :color="trajectory.color"></l-polyline>
        </l-map>
    </div>
</template>
  
<script lang="ts">
import 'leaflet/dist/leaflet.css'
import Leaflet, { LatLngExpression, LatLngBounds } from 'leaflet'
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { LMap, LTileLayer, LPolyline } from 'vue2-leaflet'

export interface TrajectoryLineMarker {
    latLngs: LatLngExpression[],
    color: string
}

@Component({
components: {
    LMap,
    LTileLayer,
    LPolyline
}
})
export default class TrajectoryMap extends Vue {
    zoom: number = 2
    attribution: string = 'Map data &copy; OpenStreetMap contributors'

    @Ref('map')
    readonly $map?: LMap

    @Prop()
    readonly trajectories: TrajectoryLineMarker[] = []


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
