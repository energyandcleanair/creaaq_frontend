enum EventCategory {
  'error' = 'error',
}

enum EventActionError {
  'any' = 'any',
}

type EventLabelError = string

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.error,
    action: EventActionError,
    label: EventLabelError
  ): void
}
