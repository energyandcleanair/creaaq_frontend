<template>
<v-form
  ref="form"
  class="fill-height overflow-y-auto px-8 pb-16 pt-16"
  v-model="isValid"
>

  <a
    class="d-inline-flex black--text"
    :href="$router.resolve({name: 'resetPassword'}).href"
    @click.prevent="$router.push({name: 'resetPassword'})"
    v-text="$t('back')"
  />
  <div class="text-h5 font-weight-bold black--text mb-2">
    {{ $t('auth.set_new_password') }}
  </div>

  <div>
    <label
      class="text-body-2 font-weight-600 black--text letter-spacing-0"
      for="form--newPassword"
      v-text="formConfig.newPassword.label"
    />
  </div>
  <v-text-field
    id="form--newPassword"
    class="mt-1 grey lighten-2 fix-inherit-border"
    v-model="formValues.newPassword"
    :rules="formConfig.newPassword.rules"
    @keydown.enter="onClickSubmit"
    autocomplete="new-password"
    type="password"
    outlined
    dense
    required
  ></v-text-field>

  <div>
    <label
      class="text-body-2 font-weight-600 black--text letter-spacing-0"
      for="form--newPasswordConfirm"
      v-text="formConfig.newPasswordConfirm.label"
    />
  </div>
  <v-text-field
    id="form--newPasswordConfirm"
    class="mt-1 grey lighten-2 fix-inherit-border"
    v-model="formValues.newPasswordConfirm"
    :rules="formConfig.newPasswordConfirm.rules"
    @keydown.enter="onClickSubmit"
    autocomplete="off"
    type="password"
    outlined
    dense
    required
  ></v-text-field>

  <v-btn
    class="mt-3 px-6 primary darken-1 font-weight-bold text-none"
    :disabled="!isValid || $loader.isLoading"
    @click="onClickSubmit"
    depressed
    block
    large
  >
    {{ $t('auth.update_password') }}
  </v-btn>
</v-form>
</template>

<script lang="ts">
import _get from 'lodash.get'
import _set from 'lodash.set'
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import AUTH_FORM_DEFAULTS from './AUTH_FORM_DEFAULTS'

@Component
export default class UpdatePasswordForm extends Vue {
  @Prop({default: true}) public value?: boolean
  @Prop() public formValues?: {[key: string]: string}

  private get isValid (): boolean {
    return !!this.value
  }
  private set isValid (val: boolean) {
    this.$emit('input', val)
  }

  private get formConfig (): {[key: string]: any} {
    return {
      newPassword: {
        ...AUTH_FORM_DEFAULTS.password,
        label: this.$t('new_password')
      },
      newPasswordConfirm: {
        ...AUTH_FORM_DEFAULTS.passwordConfirm,
        rules: [
          (v: string) => !!v || this.$t('msg.required_field'),
          (v: string) => v === _get(this.formValues, 'newPassword') ||
            this.$t('msg.passwords_dont_match')
        ]
      }
    }
  }

  private mounted () {
    _set(
      this,
      'formValues.code',
      _get(this.$route, 'query.oobCode')
    )
  }

  public validate (): void {
    (this.$refs.form as any).validate()
  }

  @Emit('submit')
  public onClickSubmit () {}
}
</script>
