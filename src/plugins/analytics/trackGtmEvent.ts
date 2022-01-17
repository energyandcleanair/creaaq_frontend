import Vue from 'vue'
import {TrackEventOptions} from '@gtm-support/vue2-gtm'

/**
 * Track an event.
 *
 * The event will only be send if the script runs in browser context and the if plugin is enabled.
 *
 * If debug mode is enabled, a "Dispatching event" is logged,
 * regardless of whether the plugin is enabled or the plugin is being executed in browser context.
 *
 * @param category passed as `target`.
 * @param action passed as `action`.
 * @param label passed as `"target-properties"`.
 * @param rest
 * @param rest.value Optional passed as `value`.
 * @param rest.noninteraction Optional `noninteraction`, passed as `"interaction-type"`.
 */
export const trackGtmEvent: ITrackGtmEventHandler = (
  category: unknown,
  action: unknown,
  label: unknown,
  rest?: TrackEventOptions
): void => {
  if (!Vue.gtm.enabled()) return

  if (category === 'auth' && action === 'set_user_id') {
    Vue.gtm.trackEvent({
      event: action,
      userId: rest?.value,
    })
    return
  }

  const opts: TrackEventOptions = {
    event: rest?.event ?? 'interaction',
    category,
    action,
    label,
    ...(rest || {}),
  }
  Vue.gtm.trackEvent(opts)
}
