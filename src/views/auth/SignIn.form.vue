<template>
  <v-form
    ref="form"
    class="fill-height overflow-y-auto px-8 pb-16 pt-16"
    v-model="isValid"
  >

    <div class="text-h5 font-weight-bold black--text mb-5">
      {{ $t('auth.login') }}
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

    <div class="d-flex">
      <label
        class="d-inline-flex text-body-2 font-weight-600 black--text letter-spacing-0"
        for="form--password"
        v-text="formConfig.password.label"
      />

      <v-spacer></v-spacer>
      <a
        class="d-inline-flex black--text"
        :href="$router.resolve({name: 'resetPassword'}).href"
        @click.prevent="$router.push({name: 'resetPassword'})"
        v-text="$t('auth.forgot_password_question')"
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

    <v-btn
      class="mt-3 px-6 primary darken-1 font-weight-bold text-capitalize"
      :disabled="!isValid || $loader.isLoading"
      @click="onClickSubmit"
      depressed
      block
      large
    >
      {{ $t('auth.login') }}
    </v-btn>

    <div class="d-flex flex-row align-center my-10">
      <v-divider class="d-inline-flex grey lighten-2" />
      <span class="d-inline-flex px-2 black--text">{{ $t('or') }}</span>
      <v-divider class="d-inline-flex grey lighten-2" />
    </div>

    <v-btn
      class="px-2 font-weight-bold text-none mb-15"
      color="grey lighten-2"
      :disabled="$loader.isLoading"
      @click="onClickLoginGoogle"
      outlined
      block
      large
    >

      <v-img
        class="ml-2"
        src="/img/google.svg"
        :height="24"
        :alt="$t('brand_name')"
        position="left center"
        contain
        style="width: 0;"
      />

      <span class="black--text">
        {{ $t('auth.login_with_google') }}
      </span>
      <v-spacer />
    </v-btn>

    <v-footer
      class="text-body-2 letter-spacing-0 flex-column pa-0 white justify-center"
      :height="70"
      absolute
    >

      <div class="font-weight-600">
        {{ $t('auth.dont_have_account_question') }}
      </div>
      <a
        class="black--text"
        :href="$router.resolve({name: 'signUp'}).href"
        @click.prevent="$router.push({name: 'signUp'})"
      >
        {{ $t('auth.sign_up') }}
      </a>
    </v-footer>
  </v-form>
</template>

<script lang="ts">
import {Component, Vue, Prop, Emit, Ref} from 'vue-property-decorator'
import AUTH_FORM_DEFAULTS from './AUTH_FORM_DEFAULTS'

@Component
export default class SignInForm extends Vue {
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
      email: AUTH_FORM_DEFAULTS.email,
      password: AUTH_FORM_DEFAULTS.password,
    }
  }

  public validate(): void {
    this.$form?.validate()
  }

  @Emit('submit')
  public onClickSubmit() {}

  @Emit('login:google')
  public onClickLoginGoogle() {}
}
</script>
