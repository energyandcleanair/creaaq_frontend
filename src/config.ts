interface ConfigParams {
  NODE_ENV: string
  APP_NAME: string
  APP_PUBLIC_NAME: string
  API_ORIGIN: string
}

export default class ConfigProvider {
  public static get CONFIG (): ConfigParams {

    /**
     * Don't forget to sync changes in the variables list with the:
     * scripts/entrypoint.sh
     **/
    return {
      NODE_ENV: '$NODE_ENV',
      APP_NAME: '$APP_NAME',
      APP_PUBLIC_NAME: '$APP_PUBLIC_NAME',
      API_ORIGIN: '$API_ORIGIN',
    }
  }

  public static value (name: keyof ConfigParams): string|undefined {
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
