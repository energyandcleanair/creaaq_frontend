<template>
    <v-container class="" fluid style="z-index: 15">
        <v-row class="d-flex ">
          <v-col cols="12" md="5" lg="6" xl="4">
            <SelectBoxCities
              label="Cities"
 
              :value="queryCities"
              :items="cities"
              :disabled="isLoading"
              @input="onChangeQuery({cities: $event})"
            />
          </v-col>

          <v-col cols="12" md="5" lg="6" xl="4" class="d-flex align-end">
            <date-picker-trajectory @onDateChange="onDateSelect" />
          </v-col>
        </v-row>
</v-container>

</template>
<script lang="ts">
import CityAPI from '@/api/CityAPI'
import PageDrawer from '@/components/PageDrawer/PageDrawer.vue'
import DatePickerTrajectory from './DatePickerTrajectory.vue'
import SelectBoxCities from '@/components/SelectBoxCities.vue'
import City from '@/entities/City'
import to from 'await-to-js'
import {Component, Prop, Vue, Emit} from 'vue-property-decorator'

@Component({
  components: {
    PageDrawer,
    SelectBoxCities,
    DatePickerTrajectory
  }
})
export default class TrajectoryFilterDrawer extends Vue {

    isLoading: boolean = false
    queryCities: string[] = []
    cities: City[] = []
    selectedCities: City[] = [];
    selectedDate?: string

    @Prop({type: Boolean, default: false})
  readonly open!: boolean

    @Emit('update:open')
  public toggle(value: boolean) {}


  async getCities() {
    const [err, res] = await to(CityAPI.findAll());
    // handle err
    if (err) {
      console.error(err);
      return err;
    }
    this.cities = res!;
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
    this.$emit("onFilterChange", {
      cities: query.cities,
      date: this.selectedDate
    });
  }

}
</script>