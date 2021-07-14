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
        <v-badge class="logo-badge" bottom content="beta">
          <v-img
            alt="Vuetify Logo"
            class="shrink mr-2"
            contain
            src="/img/logo.svg"
            transition="scale-transition"
            width="130"
          />
        </v-badge>
      </RouterLink>
    </div>

    <v-spacer/>

    <v-menu
      v-if="$auth.currentUser"
      v-model="isMenuOpen"
      :close-on-content-click="true"
      :max-width="250"
      offset-x
    >
      <template v-slot:activator="{ on, attrs }">
        <v-list-item
          style="max-width: fit-content;"
          v-bind="attrs"
          v-on="on"
        >
          <v-list-item-content>
            <v-list-item-title
              class="grey--text text--darken-2"
              v-text="userName"
            />
          </v-list-item-content>

          <v-list-item-avatar>
            <v-img
              v-if="userPhoto"
              :alt="userName"
              :src="userPhoto"
            />
            <v-icon v-else class="grey--text text--lighten-2">
              {{ mdiAccountCircle }}
            </v-icon>
          </v-list-item-avatar>
        </v-list-item>
      </template>

      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-img
              v-if="userPhoto"
              :alt="userName"
              :src="userPhoto"
            />
            <v-icon v-else class="grey--text text--lighten-2">
              {{ mdiAccountCircle }}
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content v-if="$auth.currentUser">
            <v-list-item-title v-text="userName"/>
            <v-list-item-subtitle v-if="userName && userEmail" v-text="userEmail"/>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list>
        <v-list-item
          v-for="item of menuItems"
          :key="item.id"
          :disabled="item.disabled"
          @click="item.action"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
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
import { mdiLogout, mdiAccountCircle, mdiAccount, mdiHelpCircleOutline } from '@mdi/js'
import AppDrawer from '@/components/AppDrawer.vue'
import axios from 'axios'
import config from '@/config'

@Component({
  components: {
    AppDrawer
  }
})
export default class App extends Vue {
  private mdiAccount = mdiAccount
  private mdiAccountCircle = mdiAccountCircle
  private isMenuOpen: boolean = false

  private get userName (): string {
    return this.$auth.currentUser?.displayName || 'User'
  }

  private get userEmail (): string {
    return this.$auth.currentUser?.email || ''
  }

  private get userPhoto (): string {
    return this.$auth.currentUser?.photoURL || ''
  }

  private get menuItems (): any[] {
    return [
      {
        id: 'profile',
        label: this.$t('profile'),
        icon: mdiAccount,
        disabled: this.$route.name === 'profile',
        action: () => this.$router.push({name: 'profile'}),
      },
      {
        id: 'help-n-support',
        label: this.$t('help_n_support'),
        icon: mdiHelpCircleOutline,
        disabled: this.$route.name === 'support',
        action: () => this.$router.push({name: 'support'}),
      },
      {
        id: 'logout',
        label: this.$t('auth.sign_out'),
        icon: mdiLogout,
        disabled: false,
        action: this.signOut,
      },
    ]
  }

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

<style lang="scss">
.logo-badge {
  .v-badge__wrapper {
    .v-badge__badge {
      margin-top: -10px;
      margin-left: -3px;
      padding: 2px 5px !important;
      height: auto !important;
      font-size: 0.6em !important;
      line-height: 1.1em !important;
      background: #75b44c !important;
      border-radius: 4px !important;
    }
  }
}
</style>