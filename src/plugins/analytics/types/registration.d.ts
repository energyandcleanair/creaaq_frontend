enum EventCategory {
  'registration' = 'registration',
}

enum EventActionRegistration {
  'email_and_password' = 'email_and_password',
  'google' = 'google',
}

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.registration,
    action: EventActionRegistration
  ): void
}
