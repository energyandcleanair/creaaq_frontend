import { AxiosResponse } from 'axios'
import API from './API'

type ID = string

export default class CRUD<T> {
  constructor (
    public resourceURLPrefix: string
  ) {}

  findAll (query: {[key: string]: any}|string = {}, data?: any): Promise<T[]> {
    let searchParamsStr: string = ''

    if (typeof query === 'string') {
      searchParamsStr = query
    } else {
      const searchParams = new URLSearchParams()
      Object
        .keys(query)
        .forEach(key => {
          let val = query[key]
          if (!val) return
          if (typeof val === 'object') val = JSON.stringify(val)
          searchParams.append(key, val)
        })
      searchParamsStr = searchParams.toString()
    }

    return API(Object.assign({
      method: 'GET',
      url: this.resourceURLPrefix + (searchParamsStr ? `?${searchParamsStr}` : ''),
      headers: {}
    }, data))
      .then((res: AxiosResponse) => res?.data?.data || [])
  }

  findOne (data?: any): Promise<T|null> {
    return API(Object.assign({
      method: 'GET',
      url: this.resourceURLPrefix + '/find',
      data: {},
      headers: {}
    }, data))
      .then((res: AxiosResponse) => res?.data || null)
  }

  findById (id: ID, data?: any): Promise<T|null> {
    const query = data?.query
    const searchParams = new URLSearchParams()
    Object
      .keys(query || {})
      .forEach(key => {
        let val = query[key]
        if (!val) return
        if (typeof val === 'object') val = JSON.stringify(val)
        searchParams.append(key, val)
      })

    if (data?.query) delete data.query

    return API(Object.assign({
      method: 'GET',
      url: this.resourceURLPrefix + `/${id}` + '?' + searchParams.toString(),
      data: {},
      headers: {}
    }, data))
      .then((res: AxiosResponse) => res?.data || null)
  }
}
