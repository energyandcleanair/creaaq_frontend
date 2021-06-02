import Vue from 'vue'
import LoaderInterface from './LoaderInterface'

declare module 'vue/types/vue' {
  interface Vue {
    $loader: LoaderInterface
  }
}
