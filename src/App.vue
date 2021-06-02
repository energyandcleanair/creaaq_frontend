<template>
<v-app>
  <v-app-bar
    color="white"
    clipped-left
    dark
    app
  >
    <div class="d-flex align-center">
      <RouterLink to="/">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="/img/logo.svg"
          transition="scale-transition"
          width="130"
        />
      </RouterLink>
    </div>

    <v-spacer/>

    <v-btn
      class="mr-0"
      :to="{name: 'Settings'}"
      color="primary"
      icon
    >
      <v-icon>{{ mdiCogOutline }}</v-icon>
    </v-btn>
  </v-app-bar>

  <AppDrawer/>

  <v-main>
    <RouterView/>
  </v-main>

  <CustomLoader/>
</v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mdiCogOutline } from '@mdi/js'
import AppDrawer from '@/components/AppDrawer.vue'
import axios from 'axios'
import config from '@/config'

@Component({
  components: {
    AppDrawer
  }
})
export default class App extends Vue {
  private mdiCogOutline = mdiCogOutline

  private beforeMount () {
    document.getElementsByTagName('html')[0]
      .setAttribute('app-version', require('@/../package.json').version)
  }

  private mounted () {
    this.checkConnectionToAPI()
  }

  private checkConnectionToAPI () {
    const service = axios.create({
      baseURL: config.value('API_ORIGIN'),
      withCredentials: true
    })

    service
      .get('/status')
      .then(() => {
        this.$dialog.message.info('Successfully connect to the API!', {timeout: 500})
      })
      .catch((err: any) => {
        console.error('err: ', config.value('API_ORIGIN'), err)
        this.$dialog.message.error('Could not connect to the API: ' + config.value('API_ORIGIN'))
      })
  }
}
</script>
