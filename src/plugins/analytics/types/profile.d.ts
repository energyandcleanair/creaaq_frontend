enum EventCategory {
  'profile' = 'profile',
}

enum EventActionProfile {
  'reset_password' = 'reset_password',
  'change_password' = 'change_password',
  'clear_cache' = 'clear_cache',
}

enum EventLabelProfile {}

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.profile,
    action: EventActionProfile,
    label: EventLabelProfile
  ): void
}
