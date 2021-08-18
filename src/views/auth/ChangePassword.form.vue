<template>
  <v-form
    ref="form"
    class="fill-height overflow-y-auto px-8 pb-16 pt-16"
    v-model="isValid"
  >

    <router-link
      class="d-inline-flex black--text"
      v-text="$t('back')"
      :to="{name: 'profile'}"
    />
    <div class="text-h5 font-weight-bold black--text mb-2">
      {{ $t('auth.change_password') }}
    </div>

    <div>
      <label
        class="text-body-2 font-weight-600 black--text letter-spacing-0"
        for="form--password"
        v-text="formConfig.password.label"
      />
    </div>
    <v-text-field
      id="form--password"
      class="mt-1 lighten-2 fix-inherit-border"
      v-model="formValues.password"
      :rules="formConfig.password.rules"
      @keydown.enter="onClickSubmit"
      autocomplete="password"
      type="password"
      outlined
      dense
      required
    ></v-text-field>

    <div>
      <label
        class="text-body-2 font-weight-600 black--text letter-spacing-0"
        for="form--newPassword"
        v-text="formConfig.newPassword.label"
      />
    </div>
    <v-text-field
      id="form--newPassword"
      class="mt-1 lighten-2 fix-inherit-border"
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
      class="mt-1 lighten-2 fix-inherit-border"
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
      {{ $t('auth.change_password') }}
    </v-btn>
  </v-form>
</template>

<script lang="ts">
import _get from 'lodash.get'
import _set from 'lodash.set'
import {Component, Vue, Prop, Emit, Ref} from 'vue-property-decorator'
import AUTH_FORM_DEFAULTS from './AUTH_FORM_DEFAULTS'

@Component
export default class ChangePasswordForm extends Vue {
  @Ref('form')
  readonly $form: any

  @Prop({default: true})
  public value?: boolean

  @Prop()
  public formValues?: {[key: string]: string}

  private get isValid(): boolean {
    return !!this.value
  }
  private set isValid(val: boolean) {
    this.$emit('input', val)
  }

  private get formConfig(): {[key: string]: any} {
    return {
      password: {
        ...AUTH_FORM_DEFAULTS.password,
        label: this.$t('password'),
      },
      newPassword: {
        ...AUTH_FORM_DEFAULTS.password,
        label: this.$t('new_password'),
      },
      newPasswordConfirm: {
        ...AUTH_FORM_DEFAULTS.passwordConfirm,
        rules: [
          (v: string) => !!v || this.$t('msg.required_field'),
          (v: string) =>
            v === _get(this.formValues, 'newPassword') ||
            this.$t('msg.passwords_dont_match'),
        ],
      },
    }
  }

  public validate(): void {
    this.$form?.validate()
  }

  public resetValidation(): void {
    this.$form?.resetValidation()
  }

  @Emit('submit')
  public onClickSubmit() {}
}
</script>
