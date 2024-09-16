<template>
    <div class="fill-width fill-height">
        <l-map ref="map" :options="mapOptions" @update:center="centerUpdated" @update:zoom="zoomUpdated" @ready="onMapReady">
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
          <l-feature-group ref="raster-features"></l-feature-group>
        </l-map>
    </div>

   
</template>
  
<script lang="ts">
import 'leaflet/dist/leaflet.css'
import Leaflet, { LatLngExpression, LatLngBounds, map } from 'leaflet'
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { LMap, LTileLayer, LPolyline, LWMSTileLayer, LControlLayers, LFeatureGroup } from 'vue2-leaflet'
import config from "@/config";
import dayjs from "dayjs"
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

export interface TrajectoryLineMarker {
    latLngs: LatLngExpression[],
    color: string
}

@Component({
components: {
    LMap,
    LTileLayer,
    LPolyline,
    LFeatureGroup,
    'l-wms-tile-layer': LWMSTileLayer,
    LControlLayers
}
})
export default class TrajectoryMap extends Vue {

    attribution: string = 'Map data &copy; OpenStreetMap contributors'

    @Ref('map')
    readonly $map?: LMap


    @Ref('raster-features')
    readonly $rasterFeatures?: LFeatureGroup


    @Prop()
    readonly raster!: string

    @Prop()
    readonly center!: [lat: number, lng: number]

    @Prop()
    readonly zoom!: number

    readonly defaultLayer = 'OpenStreetMap'

    @Prop()
    readonly selectedLayer: string = this.defaultLayer


    private currentZoom: number = 2
    private currentCenter: [lat: number, lng: number] = [0, 0]

    private firstPan = false

    private readonly layers =  [
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
          name: 'CartoDB.DarkMatter',
          visible: false,
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
    ]

    get tileProviders() {
      const selectedLayer = this.layers.find(layer => layer.name === this.selectedLayer) || { name: this.defaultLayer };
      return this.layers.map(layer => ({
        ...layer,
        visible: layer.name === selectedLayer.name
      }));
    }

  public get mapOptions(): Leaflet.MapOptions {
    return {
      closePopupOnClick: false,
      doubleClickZoom: 'center',
      zoom: this.zoom,
      center: [0, 0], 
    }
  }

  onMapReady() {
    if (!this.$map) return
    const mapObject = this.$map.mapObject
    mapObject.on('baselayerchange', this.onLayerVisible)
  }


  @Watch("center")
    @Watch("zoom")
    onMapChange() {
        if (!this.$map) return
        this.$map.mapObject?.setView(this.center, this.zoom)
    }

  @Emit('update:center')
  public centerUpdated(center:{lat: number, lng: number}) {
    this.currentCenter = [center.lat, center.lng]
    return center
  }

  @Emit('update:zoom')
  public zoomUpdated(zoom: number) {
    this.currentZoom = zoom
    return zoom
  }

  @Emit("update:layerSelected")
  public onLayerVisible(event: Leaflet.LayerEvent & {name?: string}) {
    console.log(event)
    return event.name ?? this.defaultLayer
  }

  @Watch("raster")
  async onRasterChange() {
    if (!this.raster || this.raster === '') return
    
    let data = await fetch(this.raster).then(res => res.arrayBuffer());
    let georaster = await parseGeoraster(data);

    const layer = new GeoRasterLayer({
      georaster,
      opacity: 0.7,
      pixelValuesToColorFn: values => {
        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${values[3]})`;
      }
    });

    // reset layer rasterFeatures
    this.$rasterFeatures?.mapObject?.clearLayers();

    layer.addTo(this.$rasterFeatures?.mapObject as any);
    this.$rasterFeatures?.mapObject?.setZIndex(99);
    
    if (this.firstPan) return

    if (this.currentZoom === 2 && this.currentCenter[0] === 0 && this.currentCenter[1] === 0) {
      this.$map?.mapObject?.fitBounds(layer.getBounds());
      this.$map?.mapObject?.panTo(layer.getBounds().getCenter());
    } else {
      this.$map?.mapObject?.panTo(this.currentCenter);
    }

    this.firstPan = true
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
