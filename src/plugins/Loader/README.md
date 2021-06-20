# Loader (`$loader`)

Plugin. Linear progress bar at the top of the page.


# Components

This plugin automatically defines the following global components:

## `<custom-loader>`
This is a wrapper component. It should be placed into the root component of your
project (typically `App.vue`), in order to make sure the component will never be
destroyed.


# API

### Methods:
- `$loader.isLoading()` - getter of the Vuex state var. Returns `boolean`.
- `$loader.on()`
- `$loader.off(force: boolean)` - if `force: true`, than the loading will be
hidden immediately without animation of completion.
