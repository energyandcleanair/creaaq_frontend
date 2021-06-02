/**
 * @param {VueComponent} component
 * @param {object} mixin
 * @param {string} mixin.mixinId - mixin's ID. Required to find if the mixin
 * has already been applied
 */
export function addMixinIfDoesntExist (component: any, mixin: any = {}) {
  if (!mixin.mixinId) {
    throw new Error('Mixin should contain property \'mixinId\'.')
  }

  const mixins = (component && component.mixins) || []

  // exit if the mixin has already been applied
  if (mixins.find((itm: any) => itm.mixinId === mixin.mixinId)) return

  component.mixins = [
    ...(component.mixins || []),
    mixin
  ]
}


/**
 * Fallback that returns the error message if try to call a method.
 * @param {string} entityName
 */
export function getObjectFallback (entityName = 'Object') {
  return new Proxy({}, {
    get (target: any, prop: string | number) {
      if (target[prop] === undefined) {
        return () => {
          console.error([
            `FrontendLayoutVue: Could not get property '${entityName}.${prop}'.`,
            `The method doesn't exists or the class '${entityName}' is not ready to use.`
          ].join('\n'))
        }
      } else {
        return target[prop]
      }
    }
  })
}
