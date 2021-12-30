export interface MapLayerConfig {
  url: string
  attribution?: string
}

export interface ConfigParams {
  NODE_ENV: string
  APP_NAME: string
  APP_PUBLIC_NAME: string
  API_ORIGIN: string
  FIREBASE_API_KEY: string
  FIREBASE_AUTH_DOMAIN: string
  FIREBASE_PROJECT_ID: string
  FIREBASE_APP_ID: string
  GTM_CONTAINER_ID: string
  GTM_ENABLED: string
  LIMIT_FETCH_ITEMS_FROM_API: string
  MAP_LAYERS: {
    SATELLITE: MapLayerConfig
    TERRAIN: MapLayerConfig
  }
}

export default class ConfigProvider {
  public static get CONFIG(): ConfigParams {
    return {
      NODE_ENV: '$NODE_ENV',
      APP_NAME: '$APP_NAME',
      APP_PUBLIC_NAME: '$APP_PUBLIC_NAME',
      API_ORIGIN: '$API_ORIGIN',
      FIREBASE_API_KEY: '$FIREBASE_API_KEY',
      FIREBASE_AUTH_DOMAIN: '$FIREBASE_AUTH_DOMAIN',
      FIREBASE_PROJECT_ID: '$FIREBASE_PROJECT_ID',
      FIREBASE_APP_ID: '$FIREBASE_APP_ID',
      GTM_CONTAINER_ID: '$GTM_CONTAINER_ID',
      GTM_ENABLED: '$GTM_ENABLED',
      LIMIT_FETCH_ITEMS_FROM_API: '$LIMIT_FETCH_ITEMS_FROM_API',
      MAP_LAYERS: {
        SATELLITE: {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        },
        TERRAIN: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
    }
  }

  public static get(name: keyof ConfigParams): string | any | undefined {
    if (!(name in this.CONFIG)) {
      return
    }

    const value = this.CONFIG[name]

    if (!value) {
      return
    }

    if (typeof value === 'string' && value.startsWith('$')) {
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
