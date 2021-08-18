export default class User {
  public id!: string
  public email!: string
  public displayName!: string

  public firstName?: string
  public lastName?: string
  public photoURL?: string

  constructor(data: User) {
    Object.assign(this, data)
  }
}
