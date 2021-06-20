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

// FIREBASE_API_KEY: "AIzaSyBp760eCCVWkjAQI0HuMd29zl7DyBDa4LM",
// FIREBASE_AUTH_DOMAIN: "crea-aq-data.firebaseapp.com",
// FIREBASE_PROJECT_ID: "crea-aq-data",
// FIREBASE_APP_ID: "1:829505003332:web:015441eadaf1210f334111",

firebase.initializeApp(firebaseAppConfig)

export default firebase
export const auth = firebase.auth()
export const getApp = () => !firebase.apps.length
  ? firebase.initializeApp(firebaseAppConfig)
  : firebase.app()

let accessToken: string = ''
export const setAccessToken = (token: string): string => {
  accessToken = token
  return accessToken
}
export const getAccessToken = (): string => accessToken
export const refreshAccessToken = async (isForce: boolean = true): Promise<any> => {
  const user: any = auth.currentUser
  setAccessToken(await user?.getIdToken(isForce) || '')
}

auth.onIdTokenChanged(async (user: any) => {
  setAccessToken(await user?.getIdToken() || '')
})
