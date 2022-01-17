interface ITrackGtmEventHandler {
  (eventCategory: 'measurements', action: 'refresh', label?: never): void
}

type MeasurementsCityName = string
interface ITrackGtmEventHandler {
  (
    eventCategory: 'measurements',
    action: 'view_city',
    label?: MeasurementsCityName
  ): void
}

type MeasurementsFileFormat = 'csv'
interface ITrackGtmEventHandler {
  (
    eventCategory: 'measurements',
    action: 'export_to_file',
    label?: MeasurementsFileFormat
  ): void
}

interface ITrackGtmEventHandler {
  (
    eventCategory: 'measurements',
    action: 'error' | 'error_too_large_query',
    label?: string
  ): void
}
