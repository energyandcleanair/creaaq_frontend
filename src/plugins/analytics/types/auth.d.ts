interface ITrackGtmEventHandler {
  (
    eventCategory: 'auth',
    action:
      | 'login_email_and_password'
      | 'login_google'
      | 'registration_email_and_password'
      | 'registration_google'
      | 'logout',
    label?: never
  ): void
}

interface ITrackGtmEventHandler {
  (
    eventCategory: 'auth',
    action:
      | 'error_auth_google'
      | 'error_login_email_and_password'
      | 'error_registration_email_and_password',
    label?: string
  ): void
}

type GoogleAnalyticsClientId = string
interface ITrackGtmEventHandler {
  (
    eventCategory: 'auth',
    action: 'set_user_id',
    label: null,
    {value: GoogleAnalyticsClientId}
  ): void
}
