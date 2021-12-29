import firebase from 'firebase/app'
import 'firebase/auth'
import config from '@/config'
import AppConfig from './AppConfig'

const firebaseAppConfig: AppConfig = {
  apiKey: config.get('FIREBASE_API_KEY') as string,
  authDomain: config.get('FIREBASE_AUTH_DOMAIN') as string,
  projectId: config.get('FIREBASE_PROJECT_ID') as string,
  appId: config.get('FIREBASE_APP_ID') as string,
}

firebase.initializeApp(firebaseAppConfig)

export default firebase
export const auth = firebase.auth()
export const getApp = () =>
  !firebase.apps.length
    ? firebase.initializeApp(firebaseAppConfig)
    : firebase.app()

let accessToken: string = ''
export const setAccessToken = (token: string): string => {
  accessToken = token
  return accessToken
}
export const getAccessToken = (): string => accessToken
export const refreshAccessToken = async (
  isForce: boolean = true
): Promise<any> => {
  const user: any = auth.currentUser
  setAccessToken((await user?.getIdToken(isForce)) || '')
}
export const getUserUID = (): string | null => {
  return auth.currentUser?.uid || null
}

auth.onIdTokenChanged(async (user: any) => {
  setAccessToken((await user?.getIdToken()) || '')
})
