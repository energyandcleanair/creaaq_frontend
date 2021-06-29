import moment from 'moment'
import computeMovingAverage from './computeMovingAverage/computeMovingAverage'

export const URL_DATE_FORMAT = 'YYYY-MM-DD'

export {
  computeMovingAverage
}

export const toURLStringDate = (d: string|number): string => typeof d === 'string'
  ? d === '0' ? '0' : moment.utc(d, URL_DATE_FORMAT).format(URL_DATE_FORMAT)
  : d === 0 ? '0' : moment.utc(+d).format(URL_DATE_FORMAT)

export const toNumberDate = (d: string): number => d === '0'
  ? 0
  : moment.utc(d, URL_DATE_FORMAT).valueOf()

export const toQueryString = (obj: {[key: string]: any}): string => {
  const searchParams = new URLSearchParams()
  Object.keys(obj)
    .forEach(key => (obj[key] !== undefined) && searchParams.append(key, obj[key]))
  return searchParams.toString()
}

export function getAverage (arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0) / arr.length
}
