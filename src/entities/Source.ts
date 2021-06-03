export default class Source {
  public id!: string
  public label!: string

  constructor (data: Source) {
    Object.assign(this, data)
  }
}
