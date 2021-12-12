# Typed GTM analytics events

This is a plugin that extends the `@gtm-support/vue2-gtm` plugin and adds the custom method `.$trackGtmEvent()` to Vue components. All this method does is just define types of arguments that allow us to have strictly typed GTM events.

Try to don't use the default `Vue.prototype.$gtm.trackEvent()` and use the custom `Vue.prototype.$trackGtmEvent()` instead.

### Examples

Both examples below are equivalent, but the second one is preferable because it's strictly typed.

```js
// example 1
...
mounted () {
  this.$gtm.trackEvent({
    category: 'auth',
    action: 'login_google',
    label: ''
  })
}
...
```

```js
// example 2
...
mounted () {
  this.$trackGtmEvent('auth', 'login_google')
}
...
```
