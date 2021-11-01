<template>
  <v-container class="view-support" fluid>
    <h1 class="d-block text-center my-5" style="display: none !important;">
      {{ $t('help_n_support') }}
    </h1>

    <v-container class="mt-5" fluid>
      <v-row justify="start">
        <v-col sm="12" md="8" lg="6">
          <iframe
            title="Feedback Form"
            class="freshwidget-embedded-form"
            id="freshwidget-embedded-form"
            src="https://energyandcleanair.freshdesk.com/widgets/feedback_widget/new?&widgetType=embedded&searchArea=no"
            scrolling="no"
            height="500px"
            width="100%"
            frameborder="0"
          >
          </iframe>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script lang="ts">
import LoadScript from 'vue-plugin-load-script'
import {Component, Vue} from 'vue-property-decorator'

Vue.use(LoadScript)

@Component
export default class ViewProfile extends Vue {
  private isLoading: boolean = false

  private beforeCreate() {
    Vue.loadScript(
      'https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.js'
    )
  }
}
</script>

<style lang="scss">
@import url(https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.css);
</style>
