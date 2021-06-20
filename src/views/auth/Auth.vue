<template>
<div
  class="view-auth fill-height"
  :class="{
    'mode--mobile': $vuetify.breakpoint.xs
  }"
>

  <v-container class="fill-height justify-center pa-0">
    <v-card
      class="page-content fill-height"
      flat
    >
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
import { Component, Vue } from 'vue-property-decorator'
import fb, { auth, refreshAccessToken } from '@/plugins/firebase'
// import User from '@/types/User'
// import VideoBanner from '@/components/VideoBanner/index.vue'
// import AUTH_FORM_DEFAULTS from './AUTH_FORM_DEFAULTS'
import FormSignIn from './SignIn.form.vue'
import FormSignUp from './SignUp.form.vue'
import FormResetPassword from './ResetPassword.form.vue'
import FormResetPasswordMessage from './ResetPasswordMessage.form.vue'
import FormUpdatePassword from './UpdatePassword.form.vue'
import FormChangePassword from './ChangePassword.form.vue'

@Component({
  components: {
    FormSignIn,
    FormSignUp,
    FormResetPassword,
    FormResetPasswordMessage,
    FormUpdatePassword,
    FormChangePassword,
    // VideoBanner
  }
})
export default class PageAuth extends Vue {
  private isValid: boolean = true

  private formMessage: string = ''
  private formValues: {[key: string]: string} = {
    name: '',
    email: '',
    password: '',
    newPassword: '',
    newPasswordConfirm: '',
    code: ''
  }

  public get formComponentName (): string {
    switch (this.$route.name) {
      case 'signIn': return 'FormSignIn'
      case 'signUp': return 'FormSignUp'
      case 'resetPassword': return 'FormResetPassword'
      case 'resetPasswordMessage': return 'FormResetPasswordMessage'
      case 'updatePassword': return 'FormUpdatePassword'
      case 'changePassword': return 'FormChangePassword'
      default: return 'FormSignUp'
    }
  }

  private async onClickSubmit (): Promise<void> {
    this.validate()

    if (!this.isValid) return

    switch (this.$route.name) {
      case 'signIn': return this.signIn()
      case 'signUp': return this.signUp()
      case 'resetPassword': return this.resetPassword()
      // case 'resetPasswordMessage': return
      case 'updatePassword': return this.updatePassword()
      case 'changePassword': return this.changePassword()
    }
  }

  public async mounted (): Promise<void> {
    this.$loader.on()
    await this.$auth.onInitialized()
    this.$loader.off()

    if (auth.currentUser && this.$route.name !== 'changePassword') {
      this.$router.push({name: 'home'})
    }
  }

  private validate (): void {
    (this.$refs.form as any).validate()
  }

  private resetValidation (): void {
    (this.$refs.form as any).resetValidation()
  }

  private async onClickLoginGoogle (): Promise<void> {
    this.$loader.on()

    const provider = new fb.auth.GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    provider.setCustomParameters({
      prompt: 'select_account'
    })

    const [err, res]: any[] = await to(
      auth.signInWithPopup(provider)
    )

    if (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        this.$loader.off()
        return
      }

      console.error(err)
      this.$loader.off()
      return this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
    }

    await refreshAccessToken(false)

    this.$router.push({name: 'home'})
    this.$loader.off()
  }

  // TODO:
  private async resetPassword (): Promise<void> {
    this.$dialog.notify.info(''+this.$tc('msg.will_be_added_soon'))
    // this.$loader.on()

    // const [err] = await to(
    //   auth.sendPasswordResetEmail(
    //     this.formValues.email,
    //     {
    //       url: window.location.origin,
    //       handleCodeInApp: true
    //     }
    //   )
    // )

    // if (err) {
    //   console.error(err)
    //   this.$loader.off()
    //   return this.$ui.dialog.notification(
    //     _get(err, 'message', this.$t('msg.something_went_wrong')),
    //     {type: 'error'}
    //   )
    // }

    // this.$router.push({name: 'resetPasswordMessage'})
    // this.$loader.off()
  }

  // TODO:
  private async updatePassword (): Promise<void> {
    this.$dialog.notify.info(''+this.$tc('msg.will_be_added_soon'))
    // this.$loader.on()

    // const [err] = await to(
    //   auth.confirmPasswordReset(
    //     this.formValues.code,
    //     this.formValues.newPassword,
    //   )
    // )

    // if (err) {
    //   console.error(err)
    //   this.$loader.off()
    //   return this.$ui.dialog.notification(
    //     _get(err, 'message', this.$t('msg.something_went_wrong')),
    //     {type: 'error'}
    //   )
    // }

    // this.$router.push({name: 'signIn'})
    // this.$loader.off()
  }

  // TODO:
  private async changePassword (): Promise<void> {
    this.$dialog.notify.info(''+this.$tc('msg.will_be_added_soon'))

    // this.$loader.on()

    // const email: string = _get(auth, 'currentUser.email', '')

    // if (!email) {
    //   this.$loader.off()
    //   return this.$ui.dialog.notification(
    //     this.$t('auth.email_wasnt_set_for_user'),
    //     {type: 'error'}
    //   )
    // }

    // let [err] = await to(auth
    //   .signInWithEmailAndPassword(email, this.formValues.password)
    // )

    // if (err) {
    //   console.error(err)
    //   this.$loader.off()
    //   return this.$ui.dialog.notification(
    //     _get(err, 'message', this.$t('msg.something_went_wrong')),
    //     {type: 'error'}
    //   )
    // }

    // if (!auth.currentUser) {
    //   console.error(err)
    //   this.$loader.off()
    //   return this.$ui.dialog.notification(
    //     this.$t('msg.not_authenticated'),
    //     {type: 'error'}
    //   )
    // }

    // [err] = await to(
    //   auth.currentUser.updatePassword(this.formValues.newPassword)
    // )

    // if (err) {
    //   console.error(err)
    //   this.$loader.off()
    //   return this.$dialog.notify.error(
    //     err?.message || ''+this.$t('msg.something_went_wrong')
    //   )
    // }

    // this.$loader.off()
    // this.resetValidation()
    // this.formValues.password = ''
    // this.formValues.newPassword = ''
    // this.formValues.newPasswordConfirm = ''
    // return this.$dialog.notify.success(
    //   ''+this.$t('auth.password_successfully_changed')
    // )
  }

  private async signIn (): Promise<void> {
    this.$loader.on()

    const [err, res] = await to<fb.auth.UserCredential>(
      auth.signInWithEmailAndPassword(
        this.formValues.email,
        this.formValues.password
      )
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      return this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
    }

    await refreshAccessToken(false)

    this.$router.push({name: 'home'})
    this.$loader.off()
  }

  private async signUp (): Promise<void> {
    let err
    this.$loader.on();

    [err] = await to<fb.auth.UserCredential>(
      auth.createUserWithEmailAndPassword(
        this.formValues.email,
        this.formValues.password
      )
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      return this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
    }

    if (!auth.currentUser) {
      console.error('User is not authenticated')
      this.$loader.off()
      return this.$dialog.notify.error(
        ''+this.$t('msg.not_authenticated')
      )
    }

    [err] = await to(
      auth.currentUser.updateProfile({
        displayName: this.formValues.name
      })
    )

    if (err) {
      console.error(err)
      this.$loader.off()
      return this.$dialog.notify.error(
        err?.message || ''+this.$t('msg.something_went_wrong')
      )
    }

    await refreshAccessToken(false)

    this.$loader.off()
    this.$dialog.notify.success(''+this.$t('msg.sign_up_success'))
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
