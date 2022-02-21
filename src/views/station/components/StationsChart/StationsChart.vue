<template>
  <v-container class="stations-chart" fluid>
    <template v-if="loading">
      <v-row class="px-2">
        <v-col cols="6">
          <v-skeleton-loader
            type="table-thead, table-row-divider@3, table-tfoot"
          />
        </v-col>
        <v-col cols="6">
          <v-skeleton-loader type="image" />
        </v-col>
      </v-row>
    </template>

    <template v-else-if="!stations.length">
      <v-alert class="text-center ma-12" color="grey lighten-3">
        {{ $t('msg.no_data') }}
      </v-alert>
    </template>

    <template v-else>
      <v-row class="stations-chart__content pb-14">
        <v-col cols="12" md="7" order="2" order-md="1">
          <v-data-table
            ref="table"
            class="elevation-1"
            :headers="tableHeaders"
            :items="tableItems"
            :options.sync="tableOptions"
            :items-per-page="10"
            :item-class="
              (item) => selectedMarkersIdsMap[item.id] && 'selected-row'
            "
            @click:row="onClickTableRow"
          >
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item._source="{item, value}">
              <v-chip
                text-color="white"
                :color="
                  item._getSourceColor ? item._getSourceColor(item) : '#000'
                "
                small
              >
                {{ value ? value.short_name || value.name : '' }}
              </v-chip>
            </template>

            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template v-slot:item._pollutants="{value}">
              {{
                value && Array.isArray(value)
                  ? value.map((i) => i.name).join(', ')
                  : ''
              }}
            </template>
          </v-data-table>

          <v-row no-gutters>
            <v-col>
              <ExportBtn
                class="ml-1 mt-2"
                :value="'CSV'"
                :disabled="loading"
                @click="onClickExport"
              />
            </v-col>

            <!-- TODO: temporarily hidden -->
            <!-- <v-col class="d-flex justify-end">
              <CopyQueryURLBtn
                class="mt-5"
                :disabled="loading"
                @click="onClickCopyQueryURL"
              />
            </v-col> -->
          </v-row>
        </v-col>

        <v-col cols="12" md="5" order="1" order-md="2">
          <l-map
            ref="map"
            class="elevation-1"
            :options="mapOptions"
            @ready="onMapInitialized"
          >
            <l-tile-layer
              :url="MAP_LAYERS.TERRAIN.url"
              :attribution="MAP_LAYERS.TERRAIN.attribution"
            />

            <l-circle-marker
              v-bind="
                selectedMarkersIdsMap[marker.id]
                  ? {
                      ...iconSelected,
                      fillColor: marker.overrideColor || iconSelected.fillColor,
                      color: marker.overrideColor || iconSelected.color,
                    }
                  : {
                      ...iconPrimary,
                      fillColor: marker.overrideColor || iconPrimary.fillColor,
                      color: marker.overrideColor || iconPrimary.color,
                    }
              "
              :ref="`marker--${marker.id}`"
              v-for="marker of mapMarkers"
              :key="marker.id"
              :lat-lng="marker.coordinates"
              @click="onClickMapMarker(marker.station.id)"
            >
              <l-tooltip
                :class="{'tooltip--selected': selectedMarkersIdsMap[marker.id]}"
                :options="{
                  permanent: permanentTooltipOnSelected,
                  interactive: false,
                  direction: 'top',
                  offset: {x: 0, y: -iconSelected.radius},
                }"
              >
                <div class="pb-2">
                  <b class="text-title font-weight-bold">
                    {{ marker.station.name }}
                  </b>
                </div>

                <div
                  v-for="(val, key) of genTooltipDetailsList(marker.station)"
                  :key="key"
                  class="text-body-2"
                  :class="{
                    'v-chip theme--light v-size--x-small white--text px-2 mb-2':
                      key === $t('source').toString(),
                  }"
                  :style="
                    key === $t('source').toString()
                      ? {
                          backgroundColor: marker.station._getSourceColor
                            ? marker.station._getSourceColor(marker.station)
                            : '#000',
                        }
                      : {}
                  "
                >
                  <b>{{ key }}:</b>&nbsp;{{ val }}
                </div>
              </l-tooltip>
            </l-circle-marker>

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
import _sortBy from 'lodash.sortby'
import chroma from 'chroma-js'
import moment from 'moment'
import json2csv from 'json2csv'
import {saveAs} from 'file-saver'
import {mdiArrowExpandAll} from '@mdi/js'
import Leaflet, {LatLngBounds} from 'leaflet'
import {LMap, LTileLayer, LCircleMarker, LTooltip} from 'vue2-leaflet'
import {Component, Vue, Prop, Ref, Emit} from 'vue-property-decorator'
import theme from '@/theme'
import config, {ConfigParams} from '@/config'
import CopyQueryURLBtn from '@/components/CopyQueryURLBtn.vue'
import ExportBtn, {ExportFileType} from '@/components/ExportBtn.vue'
import Coordinates from '@/entities/Coordinates'
import Station from '@/entities/Station'
import Source from '@/entities/Source'
import City from '@/entities/City'
import URLQuery from '../../types/URLQuery'
import ChartData from './ChartData'

const SOURCES_SCALE = chroma
  .scale([
    theme.colors.darkRed.base,
    theme.colors.orange.base,
    theme.colors.deepOrange.base,
    theme.colors.pink.base,
    theme.colors.purple.lighten1,
  ])
  .gamma(0.5)

interface MapMarker {
  id: string
  station: Station
  coordinates: number[]
  overrideColor?: string
}

@Component({
  components: {
    LMap,
    LTileLayer,
    LCircleMarker,
    LTooltip,
    ExportBtn,
    CopyQueryURLBtn,
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

  public mdiArrowExpandAll = mdiArrowExpandAll
  public iconPrimary = theme.leafletMapCircleMarkerProps.primary
  public iconSelected = theme.leafletMapCircleMarkerProps.primarySelected
  public tableOptions = {
    page: 1,
    itemsPerPage: 10,
    sortBy: ['id'],
    sortDesc: [false],
  }

  public get selectedStationsIds(): Station['id'][] {
    return this.queryParams.stations || []
  }
  public set selectedStationsIds(stations: Station['id'][]) {
    this.$emit('update:queryParams', {
      ...this.queryParams,
      stations,
    })
  }
  public get selectedMarkersIdsMap(): Record<Station['id'], number> {
    return this.selectedStationsIds.reduce(
      (map: Record<Station['id'], number>, id: Station['id']) => {
        map[id] = 1
        return map
      },
      {}
    )
  }

  public get MAP_LAYERS(): ConfigParams['MAP_LAYERS'] {
    return config.get('MAP_LAYERS')
  }

  public get cities(): City[] {
    return this.chartData.cities || []
  }

  public get citiesMap(): Map<City['id'], City> {
    const map = new Map<City['id'], City>()
    for (const city of this.cities) {
      map.set(city.id, city)
    }
    return map
  }

  public get stations(): Station[] {
    return this.chartData.stations || []
  }

  public get showCitiesCol(): boolean {
    return (this.queryParams.cities?.length || 0) > 1
  }

  public get tableHeaders(): any[] {
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
        value: '_source',
      },
      {
        text: this.$t('pollutants'),
        sortable: false,
        value: '_pollutants',
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
    ].filter((i) => i)
  }

  public tooltipDetailsCache = new Map<Station['id'], Record<string, any>>()
  public genTooltipDetailsList(station: Station): Record<string, any> {
    const cachedDetails = this.tooltipDetailsCache.get(station.id)
    if (cachedDetails) return cachedDetails
    const detailsList: Record<string, any> = {}
    detailsList[this.$t('source').toString()] = station._source
      ? station._source.short_name || station._source.name
      : ''
    detailsList[this.$t('id').toString()] = station.id
    detailsList[this.$t('type').toString()] = station.type
    detailsList[this.$t('pollutants').toString()] =
      station._pollutants?.map((i) => i.name).join(', ') || ''
    detailsList[this.$t('attribution').toString()] = station.attribution
    detailsList[this.$t('last_updated').toString()] = station.last_updated
    this.tooltipDetailsCache.set(station.id, detailsList)
    return detailsList
  }

  public get tableItems(): Station[] {
    const EMPTY = '—'

    const usedSourcesSet = new Set<Source['id']>()
    let sourceColorsMap = new Map<Source['id'], string>()
    let sourcesPaletteColors: string[] = []

    const stations = this.stations.map((_station) => {
      const station = {..._station}

      if (station.source) usedSourcesSet.add(station.source)
      if (this.showCitiesCol && station.city_id) {
        const city = this.citiesMap.get(station.city_id)
        station.city_name = city?.name || EMPTY
      }

      if (!station.type) station.type = EMPTY
      if (!station.attribution) station.attribution = EMPTY

      station.pollutants = (station.pollutants?.join(', ') || EMPTY) as any
      station.last_updated = station.last_updated
        ? moment(station.last_updated).format('YYYY-MM-DD HH:mm')
        : '-'

      station._getSourceColor = (
        _station?: Station & {__sourceColor?: string}
      ) => {
        let cachedColor = _station?.__sourceColor
        if (!_station || cachedColor) return cachedColor
        cachedColor = _station.__sourceColor = _station.source
          ? sourceColorsMap.get(_station.source)
          : undefined
        return cachedColor
      }

      return station
    })

    sourcesPaletteColors = SOURCES_SCALE.mode('lch').colors(
      usedSourcesSet.size + 1
    )
    const usedSources = _sortBy(Array.from(usedSourcesSet))
    for (let i = 0; i < usedSources.length; i++) {
      sourceColorsMap.set(usedSources[i], sourcesPaletteColors[i + 1])
    }

    return stations
  }

  public get mapOptions(): Leaflet.MapOptions {
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

  public get mapMarkers(): MapMarker[] {
    return this.tableItems
      .map((station) => {
        if (!station.coordinates) return null

        const marker: MapMarker = {
          id: station.id,
          station,
          overrideColor: station._getSourceColor?.(station),
          coordinates: [
            station.coordinates.latitude,
            station.coordinates.longitude,
          ],
        }
        return marker
      })
      .filter((i) => i) as MapMarker[]
  }

  public mounted() {
    // see this.onMapInitialized()
  }

  public onMapInitialized() {
    this.closeAllMapMarkerTooltips()

    // move to the selected station if exists
    if (this.selectedStationsIds.length) {
      this.tableMoveToStation(this.selectedStationsIds[0])
      this.mapMoveToStation(this.selectedStationsIds[0])
      this.selectStation(this.selectedStationsIds[0])
    } else {
      this.fitAllMarkers()
    }
  }

  public selectStation(stationId: Station['id']) {
    this.selectedStationsIds = stationId ? [stationId] : []

    this.closeAllMapMarkerTooltips()
    this.openMapMarkerTooltip(stationId)
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

  public mapMoveToStation(stationId: Station['id']) {
    const marker = this.mapMarkers.find((m) => m.station.id === stationId)
    if (!marker) return

    this.moveToPoint({
      latitude: marker.coordinates?.[0] || 0,
      longitude: marker.coordinates?.[1] || 0,
    })
  }

  public openMapMarkerTooltip(stationId: Station['id']) {
    if (!stationId) return
    if (!this.$map?.mapObject) return

    const $refs = this.$refs[`marker--${stationId}`] as LCircleMarker[]
    const $marker = $refs?.[0]?.mapObject
    if (!$marker) return

    $marker.openTooltip()
  }

  public closeAllMapMarkerTooltips() {
    this.$map?.mapObject?.eachLayer((layer: Leaflet.Layer) => {
      if (
        (layer as any).options.pane === 'tooltipPane' &&
        this.$map?.mapObject
      ) {
        layer.removeFrom(this.$map.mapObject)
      }
    })
  }

  public tableMoveToStation(stationId: Station['id']) {
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

  public exportToCSV(stations: Station[]) {
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
    } catch (err: any) {
      this.$loader.off()
      console.error(err)
      this.$dialog.notify.error(
        err?.message || err || '' + this.$t('msg.something_went_wrong')
      )
      throw err
    }
  }

  public onClickMapMarker(stationId: Station['id']) {
    this.selectStation(stationId)
    this.tableMoveToStation(stationId)
    this.openMapMarkerTooltip(stationId)
  }

  public onClickTableRow(station: Station) {
    this.selectStation(station.id)
    this.mapMoveToStation(station.id)
  }

  public onClickExport(fileType: ExportFileType, $event: MouseEvent) {
    if (fileType === ExportFileType.CSV) {
      this.$trackGtmEvent('stations', 'export_to_file', 'csv')
      this.exportToCSV(this.stations)
    }
  }

  @Emit('click:copy_url')
  public onClickCopyQueryURL($event: MouseEvent) {}
}
</script>

<style lang="scss">
$stations-chart__content--min-height: 450px;
$stations-chart__table-footer--height: 59px;

.stations-chart {
  padding: 0 0.5rem 0 0;

  &__content {
    .vue2leaflet-map {
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

      th,
      td {
        font-size: 14px !important;
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
