import City from '@/entities/City'
import Pollutant from '@/entities/Pollutant'
import Station from '@/entities/Station'
import {
  parseQueryString,
  toCompactArray,
  toURLStringDate,
  enumHas,
} from '@/utils'
import URLQueryAveragingPeriod from './URLQueryAveragingPeriod'

export type yyyymmdd = string

export enum URLQueryTargetEntity {
  measurement = 'measurement',
  violation = 'violation',
  station = 'station',
}

export enum URLQueryAggregation {
  station = 'station',
  city = 'city',
}

export enum URLQueryFormat {
  json = 'json',
  csv = 'csv',
}

export {URLQueryAveragingPeriod}

export interface URLQueryRaw {
  // entity
  ent: string | undefined

  // aggregation
  agr: string | undefined

  // cities
  ct: string[] | undefined

  // pollutants
  pl: string[] | undefined

  // stations
  st: string[] | undefined

  // running_average
  avg: string | undefined

  // date_start
  start: string | undefined

  // date_end
  end: string | undefined

  // format
  frm: string | undefined
}

export default class URLQuery {
  public entity!: URLQueryTargetEntity | undefined
  public aggregation!: URLQueryAggregation | undefined
  public cities!: City['id'][]
  public pollutants!: Pollutant['id'][]
  public stations!: Station['id'][]
  public averaging_period!: URLQueryAveragingPeriod | undefined
  public date_start!: yyyymmdd | undefined
  public date_end!: yyyymmdd | undefined
  public format!: URLQueryFormat | undefined

  static parseFromURLString(url: string): URLQuery {
    const queryString = url.split('?')[1]
    const q = parseQueryString<URLQueryRaw>(queryString)

    const entity = enumHas(URLQueryTargetEntity, q.ent)
      ? (q.ent as URLQueryTargetEntity)
      : undefined

    const aggregation = enumHas(URLQueryAggregation, q.agr)
      ? (q.agr as URLQueryAggregation)
      : undefined

    const format = enumHas(URLQueryFormat, q.frm)
      ? (q.frm as URLQueryFormat)
      : undefined

    return {
      entity,
      aggregation,
      cities: toCompactArray<string>(q.ct),
      pollutants: toCompactArray<string>(q.pl),
      stations: toCompactArray<string>(q.st),
      averaging_period: (q.avg as URLQueryAveragingPeriod) || undefined,
      date_start: q.start ? toURLStringDate(q.start as string) : undefined,
      date_end: q.end ? toURLStringDate(q.end as string) : undefined,
      format,
    }
  }

  static toRawQueryObject(
    inputQuery: URLQuery,
    opts?: {positive: boolean}
  ): Record<string, string | string[]> {
    const rawQuery: URLQueryRaw = {
      ent: inputQuery.entity || undefined,
      agr: inputQuery.aggregation || undefined,
      ct: inputQuery.cities || undefined,
      pl: inputQuery.pollutants || undefined,
      st: inputQuery.stations || undefined,
      avg: inputQuery.averaging_period || undefined,
      start: inputQuery.date_start
        ? toURLStringDate(inputQuery.date_start)
        : undefined,
      end: inputQuery.date_end
        ? toURLStringDate(inputQuery.date_end)
        : undefined,
      frm: inputQuery.format || undefined,
    }

    if (opts?.positive) {
      for (const key in rawQuery) {
        if (rawQuery[key as keyof URLQueryRaw] === undefined) {
          delete rawQuery[key as keyof URLQueryRaw]
        }
      }
    }

    return (rawQuery as unknown) as Record<string, string | string[]>
  }
}
