import moment from 'moment'
import computeMovingAverage from './computeMovingAverage/computeMovingAverage'

export const URL_DATE_FORMAT = 'YYYY-MM-DD'

export {computeMovingAverage}

export const toURLStringDate = (d: string | number): string =>
  typeof d === 'string'
    ? d === '0'
      ? '0'
      : moment.utc(d, URL_DATE_FORMAT).format(URL_DATE_FORMAT)
    : d === 0
    ? '0'
    : moment.utc(+d).format(URL_DATE_FORMAT)

export const toNumberDate = (d: string): number =>
  d === '0' ? 0 : moment.utc(d, URL_DATE_FORMAT).valueOf()

export const toQueryString = (obj: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  Object.keys(obj).forEach(
    (key) => obj[key] !== undefined && searchParams.append(key, obj[key])
  )
  return searchParams.toString()
}

export const parseQueryString = <T>(
  querystring: string
): T | Record<string, string | string[] | null> => {
  const params = new URLSearchParams(querystring)
  const obj: Record<string, string | string[] | null> = {}
  params.forEach((_, key) => {
    if (obj[key]) return
    if (params.getAll(key).length > 1) obj[key] = params.getAll(key)
    else obj[key] = params.get(key)
  })
  return obj
}

export const toCompactArray = <T>(itm: any): T[] =>
  (Array.isArray(itm) ? itm : [itm]).filter((i) => i)

export function getAverage(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0) / arr.length
}

export const enumHas = (_enum: any, val: any): boolean =>
  Object.values(_enum).includes(val)

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isObjEmpty(obj: Record<any, any>): boolean {
  for (const i in obj) return false
  return true
}

export function _runIteration(
  fn: any,
  numTimes: number,
  delay: number
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0

    function end() {
      resolve()
    }

    function next() {
      if (fn(index) === false) return end()
      index++
      if (index < numTimes) setTimeout(next, delay)
      else end()
    }

    next()
  })
}
