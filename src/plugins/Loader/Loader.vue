<template>
  <div class="loader-container">
    <v-progress-linear
      v-if="isLoadingProcess"
      v-model="progressValue"
      :query="query"
      :indeterminate="indeterminate"
      :color="color"
      :height="height"
      :active="active"
      :value="isLoadingProcess"
      :style="{top}"
    >
    </v-progress-linear>
  </div>
</template>

<script>
import _get from 'lodash.get'

export default {
  name: 'Loader',
  data() {
    return {
      isLoading: false,
      PROGRESS_STEP_PERCENTS: 10,
      PROGRESS_STEP_SEC: 0.5,
      progressValue: 0,
      interval: 0,
      timeouts: [],

      query: true,
      indeterminate: false,
      color: 'primary',
      top: 0,
      height: 4,
      active: true,
    }
  },
  computed: {
    isInIframe() {
      return window.location !== window.parent.location
    },
    isLoadingProcess: {
      get() {
        return this.isLoading
      },
      set(value) {
        this.isLoading = value
      },
    },
  },
  created() {
    this.isLoadingProcess = false
  },
  methods: {
    getTopPosition() {
      const $appBar = document.getElementsByClassName('v-app-bar')[0]
      return _get($appBar, 'offsetHeight', 0)
    },

    /**
     * @param {LoaderOptions} options
     */
    on(options) {
      this.top = this.getTopPosition()

      if (this.isLoadingProcess) {
        this.off(true)
      }

      this.isLoadingProcess = true
      this.startProgress()
    },

    /**
     * @param {boolean} isForce - force stop loader without animation
     */
    off(isForce) {
      if (!this.isLoadingProcess) return

      this.finish()

      if (isForce) {
        this.isLoadingProcess = false
        this.stopProgress()
      } else {
        const t1 = setTimeout(() => {
          this.isLoadingProcess = false

          const t2 = setTimeout(() => {
            this.stopProgress()
          }, 500)
          this.timeouts.push(t2)
        }, 500)
        this.timeouts.push(t1)
      }
    },

    finish() {
      this.progressValue = 100
    },

    startProgress() {
      this.stopProgress()

      const FIRST_LIMIT_PERCENTS = 80
      const LAST_LIMIT_PERCENTS = 97

      this.interval = setInterval(() => {
        if (
          this.progressValue >= FIRST_LIMIT_PERCENTS &&
          this.progressValue < LAST_LIMIT_PERCENTS
        ) {
          this.progressValue += 1
          return
        }

        if (this.progressValue >= LAST_LIMIT_PERCENTS) {
          const memo = this.progressValue

          this.progressValue += 1

          setTimeout(() => {
            this.progressValue = memo
          }, 150)
          return
        }

        this.progressValue += this.PROGRESS_STEP_PERCENTS
      }, this.PROGRESS_STEP_SEC * 1000)
    },

    stopProgress() {
      this.progressValue = 0
      clearInterval(this.interval)
      this.timeouts.forEach((t) => t && clearTimeout(t))
      this.timeouts = []
    },
  },
}
</script>

<style scoped lang="scss">
@keyframes slide-down {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.loader-container {
  z-index: 99;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;

  .v-progress-linear {
    margin: 0;
    -webkit-animation: slide-down 0.5s; /* Safari 4+ */
    -moz-animation: slide-down 0.5s; /* Fx 5+ */
    -o-animation: slide-down 0.5s; /* Opera 12+ */
    animation: slide-down 0.5s; /* IE 10+, Fx 29+ */
  }
}
</style>
