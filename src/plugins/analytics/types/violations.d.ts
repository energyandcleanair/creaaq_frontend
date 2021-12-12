interface ITrackGtmEventHandler {
  (
    eventCategory: 'violations',
    action: 'refresh' | 'enable_overshooting' | 'disable_overshooting',
    label?: never
  ): void
}

type ViolationsCityName = string
interface ITrackGtmEventHandler {
  (
    eventCategory: 'violations',
    action: 'view_city',
    label?: ViolationsCityName
  ): void
}

type ViolationsFileFormat = 'csv'
interface ITrackGtmEventHandler {
  (
    eventCategory: 'violations',
    action: 'export_to_file',
    label?: ViolationsFileFormat
  ): void
}

interface ITrackGtmEventHandler {
  (
    eventCategory: 'violations',
    action: 'error' | 'error_too_large_query',
    label?: string
  ): void
}
