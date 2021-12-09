export const trackGtmEvent: ITrackGtmEventHandler = (
  category: unknown,
  action: unknown,
  label: unknown
): void => {
  console.log('Track!', category, action, label)
  //analytics.track(eventName, props)
}
