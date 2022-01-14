<template>
  <v-btn
    :title="$t('display_parameters_panel')"
    color="primary"
    icon
    @click="$emit('click', $event)"
  >
    <v-icon>{{ mdiTune }}</v-icon>
  </v-btn>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {mdiTune} from '@mdi/js'

@Component
export default class PageDrawerHandlerBtn extends Vue {
  public mdiTune = mdiTune
}
</script>
