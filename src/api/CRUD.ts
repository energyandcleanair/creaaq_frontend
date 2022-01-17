import {AxiosResponse} from 'axios'
import {toQueryString} from '@/utils'
import API from './API'

type ID = string

export default class CRUD<T> {
  public axios: typeof API = API

  constructor(public resourceURLPrefix: string) {}

  public findAll(
    query: {[key: string]: any} | string = {},
    data?: any
  ): Promise<T[]> {
    let searchParamsStr: string = ''

    if (typeof query === 'string') {
      searchParamsStr = query
    } else {
      searchParamsStr = toQueryString(query)
    }

    return this.axios(
      Object.assign(
        {
          method: 'GET',
          url:
            this.resourceURLPrefix +
            (searchParamsStr ? `?${searchParamsStr}` : ''),
          headers: {},
        },
        data
      )
    ).then((res: AxiosResponse) => res?.data?.data || [])
  }

  public findOne(data?: any): Promise<T | null> {
    return this.axios(
      Object.assign(
        {
          method: 'GET',
          url: this.resourceURLPrefix + '/find',
          data: {},
          headers: {},
        },
        data
      )
    ).then((res: AxiosResponse) => res?.data || null)
  }

  public findById(id: ID, data?: any): Promise<T | null> {
    const query = data?.query
    if (data?.query) delete data.query

    return this.axios(
      Object.assign(
        {
          method: 'GET',
          url:
            this.resourceURLPrefix +
            `/${id}` +
            '?' +
            toQueryString(query || {}),
          data: {},
          headers: {},
        },
        data
      )
    ).then((res: AxiosResponse) => res?.data || null)
  }
}
