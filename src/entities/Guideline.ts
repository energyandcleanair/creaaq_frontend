export default class Guideline {
  public id!: string
  public name!: string

  public _violationsNumber?: number

  constructor(data: Guideline) {
    Object.assign(this, data)
  }
}
