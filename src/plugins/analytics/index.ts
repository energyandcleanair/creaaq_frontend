// export class CustomTracker implements ICustomTracker {
// export class CustomTracker implements ITrackEventHandler {
//   //  static trackEvent(eventName: Category.login, action: ActionLogin): void

//   //  static trackEvent(
//   //    eventName: Category.registration,
//   //    action: ActionRegistration
//   //  ): void

//   // static trackEvent(
//   //   eventName: Category.download,
//   //   action: ActionDownload,
//   //   label: LabelDownload
//   // ): void

//   trackEvent(category: Category, action: Action, label?: Label): void {
//     console.log('Track!', category, action, label)
//     //analytics.track(eventName, props)
//   }
// }

export const trackEvent: ITrackEventHandler = (
  category: EventCategory,
  action: string,
  label?: string
): void => {
  console.log('Track!', category, action, label)
  //analytics.track(eventName, props)
}
