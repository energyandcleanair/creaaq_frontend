type URL = string

interface ITrackGtmEventHandler {
  (
    eventCategory: 'outbound_link',
    action: never,
    label?: URL
  ): void
}
