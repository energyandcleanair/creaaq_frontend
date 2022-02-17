import {Vue, Component} from 'vue-property-decorator'

@Component
export default class ServiceWorkerUpdate extends Vue {
  public swRegistration: any = null
  public swUpdateExists: boolean = false
  public swRefreshing: boolean = false

  created() {
    // Listen for our custom event from the SW registration
    document.addEventListener('swUpdated', this.swUpdateAvailable, {once: true})

    // Prevent multiple refreshes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.swRefreshing) return
      this.swRefreshing = true
      ;(window.location.reload as (ignoreCache?: boolean) => void)(true)
    })
  }

  // Store the SW registration so we can send it a message
  // We use `updateExists` to control whatever alert, toast, dialog, etc we want to use
  // To alert the user there is an update they need to refresh for
  private swUpdateAvailable(event: any) {
    this.swRegistration = event.detail
    this.swUpdateExists = true
  }

  // Called when the user accepts the update
  public swRefreshApp() {
    this.swUpdateExists = false
    // Make sure we only send a 'skip waiting' message if the SW is waiting
    if (!this.swRegistration || !this.swRegistration.waiting) return
    // send message to SW to skip the waiting and activate the new SW
    this.swRegistration.waiting.postMessage({type: 'SKIP_WAITING'})
  }
}
