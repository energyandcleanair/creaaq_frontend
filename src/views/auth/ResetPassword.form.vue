<template>
  <v-form
    ref="form"
    class="fill-height overflow-y-auto px-8 pb-16 pt-16"
    v-model="isValid"
  >
    <a
      class="d-inline-flex black--text"
      :href="$router.resolve({name: 'signIn'}).href"
      @click.prevent="$router.push({name: 'signIn'})"
      v-text="$t('back')"
    />
    <div class="text-h5 font-weight-bold black--text mb-5">
      {{ $t('auth.forgot_password_question') }}
    </div>

    <div>
      <label
        class="text-body-2 font-weight-600 black--text letter-spacing-0"
        for="form--email"
        v-text="formConfig.email.label"
      />
    </div>
    <v-text-field
      id="form--email"
      class="mt-1 lighten-2 fix-inherit-border"
      v-model="formValues.email"
      :rules="formConfig.email.rules"
      @keydown.enter="onClickSubmit"
      autocomplete="email"
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
      {{ $t('auth.reset_password') }}
    </v-btn>
  </v-form>
</template>

<script lang="ts">
import {Component, Vue, Prop, Emit, Ref} from 'vue-property-decorator'
import AUTH_FORM_DEFAULTS from './AUTH_FORM_DEFAULTS'

@Component
export default class ResetPasswordForm extends Vue {
  @Ref('form')
  readonly $form: any

  @Prop({default: true})
  public value?: boolean

  @Prop()
  public formValues?: {[key: string]: string}

  public get isValid(): boolean {
    return !!this.value
  }
  public set isValid(val: boolean) {
    this.$emit('input', val)
  }

  public get formConfig(): {[key: string]: any} {
    return {
      email: AUTH_FORM_DEFAULTS.email,
    }
  }

  public validate(): void {
    this.$form?.validate()
  }

  @Emit('submit')
  public onClickSubmit() {}
}
</script>
