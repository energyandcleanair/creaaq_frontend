<template>
  <v-container class="view-profile" fluid>
    <h1 class="d-block text-center my-5">
      {{ $t('profile') }}
    </h1>

    <v-container class="mt-5">
      <v-row>
        <v-col>
          <v-btn color="primary" :loading="isLoading" @click="changePassword">
            {{ $t('auth.change_password') }}
          </v-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-btn color="primary" :loading="isLoading" @click="clearCache">
            {{ $t('clear_cache') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script lang="ts">
import {forageStore} from '@/api/API'
import {Component, Vue} from 'vue-property-decorator'

@Component({
  name: 'ViewProfile',
})
export default class ViewProfile extends Vue {
  public isLoading: boolean = false

  public changePassword() {
    this.$router.push({name: 'changePassword'})
  }

  public async clearCache() {
    this.$trackGtmEvent('profile', 'clear_cache')
    this.isLoading = true
    await forageStore.clear()
    this.$dialog.notify.success('' + this.$t('msg.cache_has_been_cleared'), {
      timeout: 2000,
    })
    setTimeout(() => (this.isLoading = false), 1000)
  }
}
</script>

<style lang="scss"></style>
