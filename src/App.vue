<template>
<v-app>
  <v-app-bar
    color="white"
    elevation="3"
    clipped-left
    clipped-right
    dark
    app
    style="z-index: 100;"
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

    <v-list-item
      v-if="$auth.currentUser"
      style="max-width: fit-content;"
    >
      <v-list-item-content>
        <v-list-item-title
          class="grey--text text--darken-2"
          v-text="$auth.currentUser.email"
        />
      </v-list-item-content>
    </v-list-item>

    <v-btn
      v-if="$auth.currentUser"
      class="mr-0"
      :to="{name: 'settings'}"
      color="primary"
      icon
    >
      <v-icon>{{ mdiCogOutline }}</v-icon>
    </v-btn>

    <v-btn
      v-if="$auth.currentUser"
      class="mr-0"
      color="primary"
      icon
      @click="signOut"
    >
      <v-icon>{{ mdiLogout }}</v-icon>
    </v-btn>

    <!-- <v-btn
      v-if="$auth.currentUser"
      class="mr-0"
      color="primary"
      icon
      @click="signOut"
    >
      <v-icon>{{ mdiLogout }}</v-icon>
    </v-btn> -->
  </v-app-bar>

  <AppDrawer :open="!!$auth.currentUser"/>

  <v-main>
    <RouterView/>
  </v-main>

  <CustomLoader/>
</v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mdiCogOutline, mdiLogout } from '@mdi/js'
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
  private mdiLogout = mdiLogout

  private beforeMount () {
    document.getElementsByTagName('html')[0]
      .setAttribute('app-version', require('@/../package.json').version)
  }

  private mounted () {
    this.checkConnectionToAPI()
  }

  private checkConnectionToAPI () {
    const service = axios.create({
      baseURL: config.get('API_ORIGIN'),
      withCredentials: true
    })

    service
      .get('/status')
      .then(() => {
        console.info('Successfully connect to the API')
      })
      .catch((err: any) => {
        console.error('err: ', config.get('API_ORIGIN'), err)
        this.$dialog.message.error('Could not connect to the API: ' + config.get('API_ORIGIN'))
      })
  }

  private signOut () {
    this.$auth.logout()
      .then(() => this.$router.push({name: 'signIn'}))
  }
}
</script>
