<template>
    <div>
        <v-menu
        ref="menu"
        v-model="menu"
        :close-on-content-click="false"
        :return-value.sync="date"
        transition="scale-transition"
        style='z-index:20001;'
        offset-y
     
      >
        <template v-slot:activator="{ on }" >
          <!-- <v-text-field
            v-model="date"
            label="Select date"

            readonly
            v-bind="attrs"
            v-on="on"
          ></v-text-field> -->
          <div class="d-flex">
            <v-btn value="left" size="small"  @click="decrementDate" elevation="0">
          <v-icon>{{ mdiArrowLeft }}</v-icon>
        </v-btn>

        <v-btn v-on="on" size="small" elevation="0" class="mx-1">
          {{ date ? date : 'Select date' }}
        </v-btn>

        <v-btn value="right" size="small" @click="incrementDate" elevation="0">
          <v-icon>{{ mdiArrowRight }}</v-icon>
        </v-btn>
          </div>


        </template>
        <v-date-picker
          v-model="date"
          :allowed-dates="allowedDates"
          no-title
          scrollable
        >
          <v-spacer></v-spacer>
          <v-btn
            text
            color="primary"
            @click="menu = false"
          >
            Cancel
          </v-btn>
          <v-btn
            text
            color="primary"
            @click="onDateSave"
          >
            OK
          </v-btn>
        </v-date-picker>
      </v-menu>
    </div>
</template>

<script lang="ts">
import {Component, Model, Prop, Vue} from 'vue-property-decorator'
import {
  mdiArrowLeft,
  mdiArrowRight,
} from '@mdi/js'

@Component({
  name: 'DatePickerTrajectory',
  components: {}
})
export default class DatePickerTrajectory extends Vue {
    public date: string = new Date().toISOString().substr(0, 10);
    public menu: boolean = false;
    public mdiArrowLeft = mdiArrowLeft
    public mdiArrowRight = mdiArrowRight

    @Prop({type: Array, default: []})
    public availableDates: string[] = []

    $refs!: {
      menu: any
    }
    
    public onDateSave() {
      this.$refs?.menu?.save(this.date);
      this.$emit('onDateChange', this.date);
    }

    public allowedDates(val: string) {
      const date = new Date(val);
      return this.availableDates.includes(date.toISOString().substr(0, 10));
    }

    public incrementDate() {
      const dateObj = new Date(this.date);
      dateObj.setDate(dateObj.getDate() + 1);
      this.date = dateObj.toISOString().substr(0, 10);
      this.$emit('onDateChange', this.date);
    }

    public decrementDate() {
        const dateObj = new Date(this.date);
        dateObj.setDate(dateObj.getDate() - 1);
        this.date = dateObj.toISOString().substr(0, 10);
        this.$emit('onDateChange', this.date); 
    }
}
</script>