import moment from 'moment'

export const URL_DATE_FORMAT = 'YYYY-MM-DD'

export const _toURLStringDate = (d: string|number): string => typeof d === 'string'
  ? d === '0' ? '0' : moment(d, URL_DATE_FORMAT).format(URL_DATE_FORMAT)
  : d === 0 ? '0' : moment(+d).format(URL_DATE_FORMAT)

export const _toNumberDate = (d: string): number => d === '0'
  ? 0
  : moment(d, URL_DATE_FORMAT).valueOf()

export const _toQueryString = (obj: {[key: string]: any}): string => {
  const searchParams = new URLSearchParams()
  Object.keys(obj).forEach(key => searchParams.append(key, obj[key]))
  return searchParams.toString()
}