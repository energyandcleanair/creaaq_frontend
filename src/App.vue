<template>
<v-app>
  <v-app-bar
    app
    color="white"
    dark
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
  </v-app-bar>

  <v-main>
    <RouterView/>
  </v-main>
</v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import axios from 'axios'
import config from '@/config'

@Component
export default class App extends Vue {
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
      .get('/cities')
      .then(() => {
        this.$dialog.message.info('Successfully connect to the API!')
      })
      .catch((err: unknown) => {
        console.error('err: ', config.value('API_ORIGIN'), err)
        this.$dialog.message.error('Could not connect to the API: ' + config.value('API_ORIGIN'))
      })
  }
}
</script>
