interface ITrackGtmEventHandler {
  (
    eventCategory: 'profile',
    action: 'reset_password' | 'change_password' | 'clear_cache',
    label?: never
  ): void
}

interface ITrackGtmEventHandler {
  (
    eventCategory: 'profile',
    action: 'error_reset_password' | 'error_change_password',
    label?: string
  ): void
}
