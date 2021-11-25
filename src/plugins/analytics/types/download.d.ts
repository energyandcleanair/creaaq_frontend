enum EventCategory {
  'download' = 'download',
}

enum EventActionDownload {
  'measurements' = 'measurements',
}

enum EventLabelDownload {
  'csv' = 'csv',
}

interface ITrackEventHandler {
  (
    eventCategory: EventCategory.download,
    action: EventActionDownload,
    label: EventLabelDownload
  ): void
}
