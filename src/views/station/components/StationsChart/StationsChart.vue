<template>
  <v-container
    class="stations-chart"
    fluid
  >
    <template v-if="loading">
      <v-row class="px-2">
        <v-col cols="6">
          <v-skeleton-loader type="table-thead, table-row-divider@3, table-tfoot" />
        </v-col>
        <v-col cols="6">
          <v-skeleton-loader type="image" />
        </v-col>
      </v-row>
    </template>

    <template v-else-if="!stations.length">
      <v-alert
        class="text-center ma-12"
        color="grey lighten-3"
      >
        {{ $t('msg.no_data') }}
      </v-alert>
    </template>

    <template v-else>
      <v-row class="stations-chart__content pb-14">
        <v-col
          cols="12"
          md="7"
          order="2"
          order-md="1"
        >
          <v-data-table
            ref="table"
            class="elevation-1"
            :headers="tableHeaders"
            :items="tableItems"
            :options.sync="tableOptions"
            :items-per-page="5"
            :item-class="(item) => selectedStationsIds.includes(item.id) && 'selected-row'"
            @click:row="onClickTableRow"
          />

          <ExportBtn
            class="ml-1 mt-2"
            :value="'CSV'"
            @click="onClickExport"
          />
        </v-col>

        <v-col
          cols="12"
          md="5"
          order="1"
          order-md="2"
        >
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
              :icon="selectedStationsIds.includes(marker.station.id) ? iconSelected : iconPrimary"
              @click="onClickMapMarker(marker.station.id)"
            >
              <l-tooltip
                :class="{'tooltip--selected': selectedStationsIds.includes(marker.station.id)}"
                :options="{
                permanent: permanentTooltipOnSelected,
                interactive: false,
                direction: 'top',
                offset: {x: 0, y: -41}
              }"
              >
                <div class="pb-2">
                  <b class="text-body-1 font-weight-bold">
                    {{ marker.station.name }}
                  </b>
                </div>

                <div
                  v-for="header of tooltipInfoHeaders"
                  :key="header.value"
                >
                  <b>{{header.text}}:</b> {{ marker.station[header.value] }}
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
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
import 'leaflet/dist/leaflet.css'
import _set from 'lodash.set'
import _orderBy from 'lodash.orderby'
import moment from 'moment'
import json2csv from 'json2csv'
import {saveAs} from 'file-saver'
import Leaflet, {Icon} from 'leaflet'
import {Component, Vue, Prop, Ref} from 'vue-property-decorator'
import {LMap, LTileLayer, LMarker, LTooltip} from 'vue2-leaflet'
import {mdiArrowExpandAll} from '@mdi/js'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'
import City from '@/entities/City'
import Station from '@/entities/Station'
import URLQuery from '../../types/URLQuery'
import ChartData from './ChartData'

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
  id: string
  station: Station
  coordinates: number[]
}

@Component({
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip,
    ExportBtn,
  },
})
export default class StationsChart extends Vue {
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

  private get selectedStationsIds(): Station['id'][] {
    return this.queryParams.stations || []
  }
  private set selectedStationsIds(stations: Station['id'][]) {
    this.$emit('update:queryParams', {
      ...this.queryParams,
      stations,
    })
  }

  private get cities(): City[] {
    return this.chartData.cities || []
  }

  private get stations(): Station[] {
    return this.chartData.stations || []
  }

  private get showCitiesCol(): boolean {
    return (this.queryParams.cities?.length || 0) > 1
  }

  private get tableHeaders(): any[] {
    return [
      {
        text: this.$t('id'),
        sortable: true,
        value: 'id',
      },
      this.showCitiesCol && {
        text: this.$t('city'),
        sortable: true,
        value: 'city_name',
      },
      {
        text: this.$t('name'),
        sortable: true,
        value: 'name',
      },
      {
        text: this.$t('type'),
        sortable: true,
        value: 'type',
      },
      {
        text: this.$t('source'),
        sortable: true,
        value: 'source',
      },
      {
        text: this.$t('attribution'),
        sortable: true,
        value: 'attribution',
      },
      {
        text: this.$t('last_updated'),
        sortable: true,
        value: 'last_updated',
      },
      {
        text: this.$t('pollutants'),
        sortable: false,
        value: 'pollutants',
      },
    ].filter((i) => i)
  }

  private get tooltipInfoHeaders(): any[] {
    return this.tableHeaders.filter((header) => header.value !== 'name')
  }

  private get tableItems(): Station[] {
    const EMPTY = '—'
    return this.chartData.stations.map((_station) => {
      const station = {..._station}

      if (this.showCitiesCol && station.city_id) {
        const city = this.chartData.cities.find(
          (itm) => itm.id === station.city_id
        )
        station.city_name = city?.name || EMPTY
      }

      if (!station.type) station.type = EMPTY
      if (!station.attribution) station.attribution = EMPTY

      station.pollutants = (station.pollutants?.join(', ') || EMPTY) as any
      station.last_updated = station.last_updated
        ? moment(station.last_updated).format('YYYY-MM-DD HH:mm')
        : '-'

      return station
    })
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
    return this.tableItems
      .map((station) => {
        if (!station.coordinates) return null

        const marker: MapMarker = {
          id: station.id,
          station: station,
          coordinates: [
            station.coordinates.latitude,
            station.coordinates.longitude,
          ],
        }
        return marker
      })
      .filter((i) => i) as MapMarker[]
  }

  private mounted() {
    // see this.onMapInitialized()
  }

  private onMapInitialized() {
    this.closeAllMapMarkerTooltips()

    // move to the selected station if exists
    if (this.selectedStationsIds.length) {
      this.tableMoveToStation(this.selectedStationsIds[0])
      this.mapMoveToStation(this.selectedStationsIds[0])
      this.selectStation(this.selectedStationsIds[0])
    }
  }

  private selectStation(stationId: Station['id']) {
    this.selectedStationsIds = stationId ? [stationId] : []

    this.closeAllMapMarkerTooltips()
    this.openMapMarkerTooltip(stationId)
  }

  public fitAllMarkers() {
    const markers = this.mapMarkers.map((marker) =>
      Leaflet.marker([marker.coordinates[0], marker.coordinates[1]])
    )

    const group = Leaflet.featureGroup(markers)
    this.$map?.fitBounds(group.getBounds())
  }

  private mapMoveToStation(stationId: Station['id']) {
    const marker = this.mapMarkers.find((m) => m.station.id === stationId)
    if (!marker) return

    const coords = new Leaflet.LatLng(
      marker.coordinates?.[0] || 0,
      marker.coordinates?.[1] || 0
    )
    const bounds = coords.toBounds(1000) // metres

    this.$map?.mapObject?.panTo(coords)
    this.$map?.mapObject?.fitBounds(bounds)
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

  private tableMoveToStation(stationId: Station['id']) {
    if (!stationId) return

    const items = _orderBy(
      this.tableItems,
      this.tableOptions.sortBy,
      Object.values(this.tableOptions.sortDesc)
    )

    const index = items.findIndex((item) => item.id === stationId)
    const page = Math.ceil((index + 1) / (this.tableOptions.itemsPerPage || 1))
    if (page !== this.tableOptions.page) this.tableOptions.page = page
  }

  private exportToCSV(stations: Station[]) {
    this.$loader.on()

    const filename = `stations.${moment().format('YYYY-MM-DD HH.mm.ss')}.csv`
    const fields = [
      'id',
      'name',
      'city_id',
      'source',
      'type',
      'coordinates',
      'attribution',
      'pollutants',
      'last_updated',
    ]

    const opts = {
      fields,
      header: true,
      quote: '"',
      delimiter: ',',
    }

    try {
      const csv = json2csv.parse(stations, opts)
      const blob = new Blob([csv], {type: 'application/csvcharset=utf-8'})
      saveAs(blob, filename)
      this.$loader.off()
    } catch (err) {
      this.$loader.off()
      console.error(err)
      this.$dialog.notify.error(
        err?.message || err || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }
  }

  private onClickMapMarker(stationId: Station['id']) {
    this.selectStation(stationId)
    this.tableMoveToStation(stationId)
    this.openMapMarkerTooltip(stationId)
  }

  private onClickTableRow(station: Station) {
    this.selectStation(station.id)
    this.mapMoveToStation(station.id)
  }

  public onClickExport(fileType: ExportFileType, $event: MouseEvent) {
    if (fileType === ExportFileType.CSV) {
      this.exportToCSV(this.stations)
    }
  }
}
</script>

<style lang="scss">
$stations-chart__content--min-height: 450px;
$stations-chart__table-footer--height: 59px;

.stations-chart {
  padding: 0 0.5rem 0 0;

  &__content {
    .vue2leaflet-map {
      border-radius: 4px;
      z-index: 1;
      max-height: 700px;

      .leaflet-tooltip {
        // the pseudo selector :has() isn't supported yet, but soon
        &:has(.tooltip--selected) {
          z-index: 100;
        }
      }
    }

    .v-data-table {
      position: relative;

      .v-data-table__wrapper {
        min-height: calc(
          #{$stations-chart__content--min-height} - #{$stations-chart__table-footer--height}
        );
        padding-bottom: $stations-chart__table-footer--height;
      }

      tbody {
        tr {
          cursor: pointer !important;

          &.selected-row {
            background: var(--v-primary-lighten4);

            &:hover {
              background: var(--v-primary-lighten5) !important;
            }
          }
        }
      }

      .v-data-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        height: $stations-chart__table-footer--height;
        width: 100%;
      }
    }

    .v-data-table,
    .vue2leaflet-map {
      min-height: 450px;
    }
  }
}
</style>