// import firebase from 'firebase'
import { Store } from 'vuex'
import User from '@/entities/User'
import { auth } from '@/plugins/firebase'

export default class Auth {
  private _isInitialized: boolean = false
  private _store: Store<any>
  // private _firebase: any

  constructor (store: Store<any>, firebase: any) {
    this._store = store
    // this._firebase = firebase

    // TODO: create own Vuex Store Module for the plugin
    // this._store.registerModule('auth', {
    //   state: new ModuleState(),
    //   getters: {
    //     // GET (state) {
    //     //   return (key: string) => _get(state, key)
    //     // },
    //   },
    //   actions: {
    //     // SET (context, {key, value}: {key: string, value: any}) {
    //     //   context.commit('SET', {key, value})
    //     // },
    //   },
    //   mutations: {
    //     // SET (state, {key, value}: {key: string, value: any}) {
    //     //   _set(state, key, value)
    //     // },
    //     // SET_LOCALE: (state, payload: ModuleState['locale']) => {
    //     //   state.locale = payload
    //     //   i18n.locale = payload
    //     // },
    //   },
    // })

    auth.onAuthStateChanged((user: any|null) => {
      this._store.commit('SET_CURRENT_USER', user?.toJSON() || null)
    })
  }

  public get currentUser (): User|null {
    return this._store.state.currentUser
  }

  public onInitialized (): Promise<void> {
    return new Promise((resolve: () => void) => {
      if (this._isInitialized) return resolve()
      auth.onAuthStateChanged(() => {
        this._isInitialized = true
        resolve()
      })
    })
  }

  public logout (): Promise<void> {
    this._store.commit('SET_CURRENT_USER', null)
    return auth.signOut()
  }
}
