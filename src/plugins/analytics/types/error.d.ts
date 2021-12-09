interface ITrackGtmEventHandler {
  (
    eventCategory: 'error',
    action: string,
    label?: string
  ): void
}
