interface ConfigParams {
  NODE_ENV: string
  APP_NAME: string
  APP_PUBLIC_NAME: string
  API_ORIGIN: string
  FIREBASE_API_KEY: string
  FIREBASE_AUTH_DOMAIN: string
  FIREBASE_PROJECT_ID: string
  FIREBASE_APP_ID: string
}

export default class ConfigProvider {
  public static get CONFIG (): ConfigParams {
    return {
      NODE_ENV: '$NODE_ENV',
      APP_NAME: '$APP_NAME',
      APP_PUBLIC_NAME: '$APP_PUBLIC_NAME',
      API_ORIGIN: '$API_ORIGIN',
      FIREBASE_API_KEY: '$FIREBASE_API_KEY',
      FIREBASE_AUTH_DOMAIN: '$FIREBASE_AUTH_DOMAIN',
      FIREBASE_PROJECT_ID: '$FIREBASE_PROJECT_ID',
      FIREBASE_APP_ID: '$FIREBASE_APP_ID',
    }
  }

  public static get (name: keyof ConfigParams): string|undefined {
    if (!(name in this.CONFIG)) {
      return
    }

    const value = this.CONFIG[name]

    if (!value) {
      return
    }

    if (value.startsWith('$')) {
      const envName = value.substr(1)
      const envValue = process.env[envName]
      const envValue2 = process.env['VUE_APP_' + envName]
      if (envValue) {
        return envValue
      } else if (envValue2) {
        return envValue2
      } else {
        return
      }
    } else {
      return value
    }
  }
}
