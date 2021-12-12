type OutboundLinkURL = string

interface ITrackGtmEventHandler {
  (
    eventCategory: 'outbound_link',
    action: 'measurements_source',
    label?: OutboundLinkURL
  ): void
}
