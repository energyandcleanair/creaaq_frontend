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
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="date"
            label="Select date"

            readonly
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-date-picker
          v-model="date"
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
import {Component, Model, Vue} from 'vue-property-decorator'

@Component({
  name: 'DatePickerTrajectory',
  components: {}
})
export default class DatePickerTrajectory extends Vue {
    public date!: string;
    public menu: boolean = false;
    
    $refs!: {
      menu: any
    }

    public onDateSave() {
      this.$refs?.menu?.save(this.date);
      this.$emit('onDateChange', this.date);
    }
}
</script>