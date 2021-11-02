<template>
  <v-form ref="form" class="fill-height overflow-y-auto px-8 pb-16 pt-16">
    <a
      class="d-inline-flex black--text"
      :href="$router.resolve({name: 'resetPassword'}).href"
      @click.prevent="$router.push({name: 'resetPassword'})"
      v-text="$t('back')"
    />
    <div class="text-h5 font-weight-bold black--text mb-2">
      {{ $t('auth.reset_password') }}
    </div>

    <div class="text-body-2 font-weight-normal black--text mb-5">
      {{ $t('auth.reset_password_done_instruction') }}
    </div>
  </v-form>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'

@Component
export default class ResetPasswordMessageForm extends Vue {
  private get isValid(): boolean {
    return true
  }
  private set isValid(val: boolean) {}

  public validate(): void {}
}
</script>
