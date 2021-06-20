export default class User {
  public id!: string
  public email!: string

  public firstName?: string
  public lastName?: string

  constructor (data: User) {
    Object.assign(this, data)
  }
}
