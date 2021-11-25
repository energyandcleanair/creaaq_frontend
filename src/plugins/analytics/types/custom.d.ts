enum EventCategory {
  'custom' = 'custom',
}

type EventActionCustom = string

type EventLabelCustom = string

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.custom,
    action: EventActionCustom,
    label: EventLabelCustom
  ): void
}
