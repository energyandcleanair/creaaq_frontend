interface ITrackGtmEventHandler {
  (
    eventCategory: 'registration',
    action: 'email_and_password' | 'google',
    label?: never
  ): void
}
