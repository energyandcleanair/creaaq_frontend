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

@Component
export default class ViewProfile extends Vue {
  private isLoading: boolean = false

  private changePassword() {
    this.$router.push({name: 'changePassword'})
  }

  private clearCache() {
    this.isLoading = true
    forageStore.clear()
    setTimeout(() => (this.isLoading = false), 1000)
  }
}
</script>

<style lang="scss"></style>
