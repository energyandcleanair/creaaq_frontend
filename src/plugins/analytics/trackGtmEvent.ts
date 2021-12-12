import Vue from 'vue'
import {TrackEventOptions} from '@gtm-support/vue2-gtm'

export const trackGtmEvent: ITrackGtmEventHandler = (
  category: unknown,
  action: unknown,
  label: unknown,
  rest?: TrackEventOptions
): void => {
  const opts: TrackEventOptions = {
    category,
    action,
    label,
    ...(rest || {}),
  }
  Vue.gtm.trackEvent(opts)
}
