interface ITrackGtmEventHandler {
  (
    eventCategory: 'login',
    action: 'email_and_password' | 'google',
    label?: never
  ): void
}
