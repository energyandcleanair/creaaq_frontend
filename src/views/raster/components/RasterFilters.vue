<template>
    <v-container class="" fluid style="z-index: 15">
        <v-row class="d-flex ">
          <v-col cols="12" md="5" lg="6" xl="4">
            <v-select
              :items="countryItems"
              v-model="selectedCountry"
              label="Countries"
              @input="onCountrySelect"
            ></v-select>
          </v-col>
          <v-col cols="12" md="5" lg="6" xl="4">
            <SelectBoxRasters 
              label="Select Raster"
              :items="rasterItems"
              :disabled="isLoading"
              :value="selectedRaster"
              @input="onRasterSelect($event)"
            />
          </v-col>
        </v-row>
</v-container>

</template>
<script lang="ts">
import CityAPI from '@/api/CityAPI'
import TrajectoryDateAPI from '@/api/TrajectoryDateAPI'
import PageDrawer from '@/components/PageDrawer/PageDrawer.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import SelectBoxRasters from '@/components/SelectBoxRasters.vue'
import City from '@/entities/City'
import to from 'await-to-js'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import Raster from '@/entities/Raster'
import { RasterAPI } from '@/api/RasterAPI'
import { MetaData } from '@/entities/MetaData'

@Component({
  components: {
    PageDrawer,
    SelectBoxCities,
    SelectBoxRasters
  }
})
export default class RasterFilterDrawer extends Vue {

    isLoading: boolean = false

    rasters: Raster[] = []
    countryItems: string[] = []

    rasterItems: Raster[] = []

    metadata: MetaData[] = []

    @Prop()
    selectedRaster: string = "";

    selectedCountry: string = "All Countries"


    readonly rasterApi = new RasterAPI()


    @Prop({type: Boolean, default: false})
    readonly open!: boolean

    @Emit('update:open')
    public toggle(value: boolean) {}


  mounted() {
    this.getRasters();
  }

  public async getRasters() {
    this.rasterApi.get_rasters().then((rasters: Raster[]) => {
      this.rasters = rasters
      this.rasterItems = rasters

      this.countryItems = Array.from(new Set(rasters.map(r => r.metadata.Country)))
      this.countryItems = ["All Countries", ...this.countryItems]
    })
  }

  public onCountrySelect(country: string) {
    if (country == "All Countries") {
      this.rasterItems = this.rasters
    } else {
      this.rasterItems = this.rasters.filter(r => r.metadata.Country == country)
    }
  }


  @Emit('onFilterChange')
  public onRasterSelect(raster: string) {
    let name = (raster.split("/").pop())?.split(".")[0]

    let rasterData = this.rasters.find(r => r.name == name);
    
    return {
      raster,
      meta: rasterData?.metadata
    }
  }


}
</script>