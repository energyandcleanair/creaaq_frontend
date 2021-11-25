import {trackEvent} from './index'

// ok
trackEvent(EventCategory.login, EventActionLogin.email_and_password)
trackEvent(EventCategory.registration, EventActionRegistration.google)
trackEvent(
  EventCategory.download,
  EventActionDownload.measurements,
  EventLabelDownload.csv
)
trackEvent(EventCategory.custom, 'asd', 'asd')

// fail
// trackEvent(EventCategory.download, 'asd')
// trackEvent('asd', 'asd', 'asd')
