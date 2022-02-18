<template>
  <div class="view-tropomi-no2 fill-height">
    <v-container class="page-content pa-0" fluid>
      <iframe
        class="fill-width fill-height"
        src="https://hubertthieriot.users.earthengine.app/view/crea-no2---lockdown-impact"
        frameborder="0"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import {Vue, Component} from 'vue-property-decorator'
import config from '@/config'

@Component({
  name: 'ViewTropomiNo2',
  metaInfo() {
    return {
      title: `TROPOMI NO2 - ${config.get('APP_PUBLIC_NAME')}`,
    }
  },
})
export default class ViewTropomiNo2 extends Vue {}
</script>

<style lang="scss">
$view-tropomi-no2__google-app__header--height: 70px;

.view-tropomi-no2 {
  overflow: hidden;
  position: unset;

  > .page-content {
    position: relative;
    z-index: 1;
    margin-top: -$view-tropomi-no2__google-app__header--height;
    height: calc(100% + #{$view-tropomi-no2__google-app__header--height});
  }
}
</style>
