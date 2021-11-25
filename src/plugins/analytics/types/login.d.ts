enum EventCategory {
  'login' = 'login',
}

enum EventActionLogin {
  'email_and_password' = 'email_and_password',
  'google' = 'google',
}

type EventLabelProfile = undefined

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.login,
    action: EventActionLogin,
    label?: EventLabelProfile
  ): void
}
