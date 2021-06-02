import LoaderOptions from './LoaderOptions'

export default interface LoaderInterface {
  isInIframe: boolean
  isLoadingProcess: boolean
  on: (opts?: LoaderOptions) => void
  off: (isForce?: boolean) => void
}