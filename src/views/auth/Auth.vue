<template>
  <div
    class="view-auth fill-height"
    :class="{
      'mode--mobile': $vuetify.breakpoint.xs,
    }"
  >
    <v-container class="fill-height justify-center pa-0">
      <v-card class="page-content fill-height" flat>
        <v-card-text class="px-0 fill-height">
          <component
            :is="formComponentName"
            ref="form"
            v-model="isValid"
            :message="formMessage"
            :formValues.sync="formValues"
            @submit="onClickSubmit"
            @login:google="onClickLoginGoogle"
          />
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import to from 'await-to-js'
import _get from 'lodash.get'
import {Component, Ref, Vue} from 'vue-property-decorator'
import fb, {auth, refreshAccessToken} from '@/plugins/firebase'
import FormSignIn from './SignIn.form.vue'
import FormSignUp from './SignUp.form.vue'
import FormResetPassword from './ResetPassword.form.vue'
import FormResetPasswordMessage from './ResetPasswordMessage.form.vue'
import FormChangePassword from './ChangePassword.form.vue'

@Component({
  components: {
    FormSignIn,
    FormSignUp,
    FormResetPassword,
    FormResetPasswordMessage,
    FormChangePassword,
  },
})
export default class PageAuth extends Vue {
  @Ref('form')
  readonly $form: any

  public isValid: boolean = true

  public formMessage: string = ''
  public formValues: {[key: string]: string} = {
    name: '',
    email: '',
    password: '',
    newPassword: '',
    newPasswordConfirm: '',
    code: '',
  }

  public get formComponentName(): string {
    switch (this.$route.name) {
      case 'signIn':
        return 'FormSignIn'
      case 'signUp':
        return 'FormSignUp'
      case 'resetPassword':
        return 'FormResetPassword'
      case 'resetPasswordMessage':
        return 'FormResetPasswordMessage'
      case 'changePassword':
        return 'FormChangePassword'
      default:
        return 'FormSignUp'
    }
  }

  public async onClickSubmit(): Promise<void> {
    this.validate()

    if (!this.isValid) return

    switch (this.$route.name) {
      case 'signIn':
        return this.signIn()
      case 'signUp':
        return this.signUp()
      case 'resetPassword':
        return this.sendPasswordResetEmail()
      case 'resetPasswordMessage':
        return
      case 'changePassword':
        return this.changePassword()
    }
  }

  public async mounted(): Promise<void> {
    this.$loader.on()
    await this.$auth.onInitialized()
    this.$loader.off()

    if (auth.currentUser && this.$route.name !== 'changePassword') {
      this.$router.push({name: 'home'})
    }
  }

  public validate(): void {
    this.$form?.validate()
  }

  public resetValidation(): void {
    this.$form?.resetValidation()
  }

  public async onClickLoginGoogle(): Promise<void> {
    this.$loader.on()

    const provider = new fb.auth.GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    provider.setCustomParameters({prompt: 'select_account'})

    const [err, res]: [any, fb.auth.UserCredential | undefined] = await to(
      auth.signInWithPopup(provider)
    )

    if (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        this.$loader.off()
        return
      }

      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent('auth', 'error_auth_google', err.message)
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    if (res?.additionalUserInfo?.isNewUser === true) {
      this.$trackGtmEvent('auth', 'registration_google')
    } else {
      this.$trackGtmEvent('auth', 'login_google')
    }

    await refreshAccessToken(false)

    this.$router.push({name: 'home'})
    this.$loader.off()
  }

  public async sendPasswordResetEmail(): Promise<void> {
    this.$loader.on()

    const [err] = await to(
      auth.sendPasswordResetEmail(this.formValues.email, {
        url: window.location.origin,
        handleCodeInApp: true,
      })
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent('profile', 'error_reset_password', err.message)
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    this.$trackGtmEvent('profile', 'reset_password')
    this.$router.push({name: 'resetPasswordMessage'})
    this.$loader.off()
  }

  public async changePassword(): Promise<void> {
    this.$loader.on()

    const email: string = _get(auth, 'currentUser.email', '')

    if (!email) {
      this.$loader.off()
      return this.$dialog.notify.error(
        '' + this.$t('auth.email_wasnt_set_for_user')
      )
    }

    let [err] = await to(
      auth.signInWithEmailAndPassword(email, this.formValues.password)
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent('profile', 'error_change_password', err.message)
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    if (!auth.currentUser) {
      console.error(err)
      this.$loader.off()
      return this.$dialog.notify.error('' + this.$t('msg.not_authenticated'))
    }

    ;[err] = await to(
      auth.currentUser.updatePassword(this.formValues.newPassword)
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent('profile', 'error_change_password', err.message)
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    this.$loader.off()
    this.resetValidation()
    this.formValues.password = ''
    this.formValues.newPassword = ''
    this.formValues.newPasswordConfirm = ''
    this.$trackGtmEvent('profile', 'change_password')
    return this.$dialog.notify.success(
      '' + this.$t('auth.password_successfully_changed')
    )
  }

  public async signIn(): Promise<void> {
    this.$loader.on()

    const [err] = await to<fb.auth.UserCredential>(
      auth.signInWithEmailAndPassword(
        this.formValues.email,
        this.formValues.password
      )
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent('auth', 'error_login_email_and_password', err.message)
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    this.$trackGtmEvent('auth', 'login_email_and_password')
    await refreshAccessToken(false)

    this.$router.push({name: 'home'})
    this.$loader.off()
  }

  public async signUp(): Promise<void> {
    let err
    this.$loader.on()
    ;[err] = await to<fb.auth.UserCredential>(
      auth.createUserWithEmailAndPassword(
        this.formValues.email,
        this.formValues.password
      )
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent(
        'auth',
        'error_registration_email_and_password',
        err.message
      )
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    if (!auth.currentUser) {
      console.error('User is not authenticated')
      this.$loader.off()
      return this.$dialog.notify.error('' + this.$t('msg.not_authenticated'))
    }

    ;[err] = await to(
      auth.currentUser.updateProfile({displayName: this.formValues.name})
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      this.$trackGtmEvent(
        'auth',
        'error_registration_email_and_password',
        err.message
      )
      return this.$dialog.notify.error(
        err?.message || '' + this.$t('msg.something_went_wrong')
      )
    }

    this.$trackGtmEvent('auth', 'registration_email_and_password')
    await refreshAccessToken(false)

    this.$loader.off()
    this.$dialog.notify.success('' + this.$t('msg.sign_up_success'))
    this.$router.push({name: 'dashboard'})
  }
}
</script>

<style lang="scss">
$view-auth__footer__height: 70px;

.view-auth {
  .page-content.v-card {
    z-index: 5;
    width: 500px;

    .v-card__title {
      height: $view-auth__footer__height;
    }

    .v-card__text {
      height: calc(100% - #{$view-auth__footer__height});
    }
  }

  &.mode--mobile .page-content {
    width: 100%;
  }
}
</style>
