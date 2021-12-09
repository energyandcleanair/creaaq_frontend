export interface ITrackGtmEventHandler {
  (eventCategory: 'custom', action: string, label?: string): void
}
