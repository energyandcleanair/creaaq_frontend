interface ITrackGtmEventHandler {
  (eventCategory: 'stations', action: 'refresh', label?: never): void
}

type ViolationsCityName = string
interface ITrackGtmEventHandler {
  (
    eventCategory: 'stations',
    action: 'view_city',
    label?: ViolationsCityName
  ): void
}

type ViolationsFileFormat = 'csv'
interface ITrackGtmEventHandler {
  (
    eventCategory: 'stations',
    action: 'export_to_file',
    label?: ViolationsFileFormat
  ): void
}

interface ITrackGtmEventHandler {
  (
    eventCategory: 'stations',
    action: 'error' | 'error_too_large_query',
    label?: string
  ): void
}
