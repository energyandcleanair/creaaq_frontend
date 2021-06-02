export default class Source {
  public label!: string
  public value!: string

  // TODO: add props
  public id?: string

  constructor (data: Source) {
    Object.assign(this, data)
  }
}
