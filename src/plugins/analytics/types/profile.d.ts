interface ITrackGtmEventHandler {
  (
    eventCategory: 'profile',
    action: 'reset_password' | 'change_password' | 'clear_cache',
    label: never
  ): void
}
