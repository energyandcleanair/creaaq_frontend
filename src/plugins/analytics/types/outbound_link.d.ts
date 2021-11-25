enum EventCategory {
  'outbound_link' = 'outbound_link',
}

enum EventActionOutboundLink {
  'any' = 'any',
}

// type URL = string
type EventLabelOutboundLink = string

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.outbound_link,
    action: EventActionOutboundLink,
    label?: EventLabelOutboundLink
  ): void
}
