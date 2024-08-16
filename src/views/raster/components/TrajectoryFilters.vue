<template>
    <v-container class="" fluid style="z-index: 15">
        <v-row class="d-flex ">
          <v-col cols="12" md="5" lg="6" xl="4">
            <SelectBoxRasters 
              label="Rasters"
              :value="queryRasters"
              :items="rasters"
              :disabled="isLoading"
              @input="onChangeQuery({rasters: $event})"
            />
          </v-col>

          <v-col cols="12" md="5" lg="6" xl="4" class="d-flex align-end">
            <date-picker-trajectory @onDateChange="onDateSelect" :availableDates="availableDates" />
          </v-col>
        </v-row>
</v-container>

</template>
<script lang="ts">
import CityAPI from '@/api/CityAPI'
import TrajectoryDateAPI from '@/api/TrajectoryDateAPI'
import PageDrawer from '@/components/PageDrawer/PageDrawer.vue'
import DatePickerTrajectory from './DatePickerTrajectory.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import SelectBoxRasters from '@/components/SelectBoxRasters.vue'
import City from '@/entities/City'
import to from 'await-to-js'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'
import Raster from '@/entities/Raster'

@Component({
  components: {
    PageDrawer,
    SelectBoxCities,
    DatePickerTrajectory,
    SelectBoxRasters
  }
})
export default class TrajectoryFilterDrawer extends Vue {

    isLoading: boolean = false
    queryCities: string[] = []
    cities: City[] = []
    rasters: Raster[] = []
    selectedCities: City[] = [];
    selectedDate?: string
    availableDates: string[] = []


    @Prop({type: Boolean, default: false})
  readonly open!: boolean

    @Emit('update:open')
  public toggle(value: boolean) {}


  async getCities() {
    const [err, res] = await to(CityAPI.findAll({ with_trajectories: true   }));
    // handle err
    if (err) {
      console.error(err);
      return err;
    }
    this.cities = res!;
  }

  async getDates() {
    if (this.selectedCities.length === 0) {
      this.availableDates = []
      return
    }
    let qs = this.selectedCities.join("&location_id=");
    qs = "location_id=" + qs

    const [err, res] = await to(TrajectoryDateAPI.findAll(qs));    
    // handle err
    if (err) {
      console.error(err)
      return err
    }

    this.availableDates = [...res!]
  }

  mounted() {
    this.getCities();
  }

  public onDateSelect(date: string) {
    this.selectedDate = date
    this.$emit("onFilterChange", {
      cities: this.selectedCities,
      date
    })
  }

  public async onChangeQuery(query: any) {
    console.log("onchange cities")
    this.selectedCities = query.cities;
    console.log(this.selectedCities)
    this.getDates();
    this.$emit("onFilterChange", {
      cities: query.cities,
      date: this.selectedDate
    });
  }

}
</script>