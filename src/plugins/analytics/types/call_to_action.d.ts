enum EventCategory {
  'call_to_action' = 'call_to_action',
}

enum EventActionCallToAction {
  'any' = 'any',
}

type EventLabelCallToAction = string

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.call_to_action,
    action: EventActionCallToAction,
    label?: EventLabelCallToAction
  ): void
}
