<template>
<div class="dates-interval-input">
  <v-menu
    v-model="isMenuOpen"
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="300"
    max-width="300"
    offset-y
    right
  >
    <template v-slot:activator="{ on, attrs }">
      <div class="caption grey--text text--darken-2">
        {{ $t('dates_interval.title') }}
      </div>

      <div>
        <v-btn
          class="main-button"
          v-bind="attrs"
          v-on="on"
          :loading="loading || !formattedValue"
          :disabled="disabled"
          depressed
        >
          <span v-html="formattedValue" />
        </v-btn>
      </div>
    </template>

    <v-card flat>
      <v-list>
        <v-list-item
          v-for="option of DATES_RANGES"
          :key="option.value"
          :input-value="privateInterval === option.value"
          active-class="primary--text"
          @click="onClickMenuOption(option.value)"
        >
          <template v-if="option.value === 'custom'">
            <v-container class="px-0 py-2">
              <v-row no-gutters>
                <v-col>
                  <span class="py-3 body-1">
                    {{ $t('dates_interval.custom') }}
                  </span>
                </v-col>
              </v-row>

              <v-row class="mt-0">
                <v-col cols="12" sm="6">
                  <v-menu
                    v-model="isMenuDateStartOpen"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    min-width="auto"
                    offset-y
                    right
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        :value="privateInterval === 'all' ? '' : dateStartFormat"
                        :label="$t('from')"
                        :prepend-icon="mdiCalendar"
                        :disabled="disabled"
                        readonly
                        hide-details
                        v-bind="attrs"
                        v-on="on"
                      />
                    </template>

                    <v-date-picker
                      :value="dateStartFormat"
                      :min="datePickersRules.start.min"
                      :max="datePickersRules.start.max"
                      @input="($e) => {
                        onChange({dateStart: +new Date($e), dateEnd});
                        isMenuDateStartOpen = false;
                      }"
                    />
                  </v-menu>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-menu
                    v-model="isMenuDateEndOpen"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    min-width="auto"
                    offset-y
                    right
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        :value="privateInterval === 'all' ? '' : dateEndFormat"
                        :label="$t('to')"
                        :prepend-icon="mdiCalendar"
                        :disabled="disabled"
                        readonly
                        hide-details
                        v-bind="attrs"
                        v-on="on"
                      />
                    </template>

                    <v-date-picker
                      :value="dateEndFormat"
                      :min="datePickersRules.end.min"
                      :max="datePickersRules.end.max"
                      @input="($e) => {
                        onChange({dateStart, dateEnd: +new Date($e)});
                        isMenuDateEndOpen = false;
                      }"
                    />
                  </v-menu>
                </v-col>
              </v-row>
            </v-container>
          </template>

          <template v-else>
            {{ option.label }}
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</div>
</template>

<script lang="ts">
import { mdiCalendar } from '@mdi/js'
import moment from 'moment'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import DatesIntervals from './DatesIntervals'
import DateInterval from './DateInterval'

@Component
export default class DatesIntervalInput extends Vue {

  @Prop({type: String, required: false})
  readonly interval!: DatesIntervals

  @Prop({type: Number, default: 0})
  readonly dateStart!: number

  @Prop({type: Number, default: 0})
  readonly dateEnd!: number

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  @Prop({type: Boolean, default: false})
  readonly loading!: boolean

  @Prop({type: String, default: 'YYYY-MM-DD'})
  readonly format!: any

  private mdiCalendar = mdiCalendar
  private privateInterval: DatesIntervals|null = null
  private isMenuOpen: boolean = false
  private isMenuDateStartOpen: boolean = false
  private isMenuDateEndOpen: boolean = false

  private get dateStartFormat (): string {
    return moment.utc(this.dateStart).format(this.format)
  }

  private get dateEndFormat (): string {
    return moment.utc(this.dateEnd).format(this.format)
  }

  private get maxDate (): string {
    return moment().format('YYYY-MM-DD')
  }

  private get datePickersRules (): any {
    const frmt = (date?: number) => moment.utc(date).format('YYYY-MM-DD')
    const min = frmt(+moment.utc().year(moment().year() - 100))
    return {
      start: {
        min: min,
        max: this.dateEnd ? frmt(this.dateEnd) : frmt(),
      },
      end: {
        min: this.dateStart ? frmt(this.dateStart) : min,
        max: frmt(),
      },
    }
  }

  private get DATES_RANGES (): DateInterval[] {
    return [
      {
        value: DatesIntervals['year:0'],
        label: ''+this.$t('dates_interval.this_year'),
      },
      {
        value: DatesIntervals['year:-1'],
        label: ''+this.$t('dates_interval.last_n_years', {n: 2}),
      },
      {
        value: DatesIntervals['year:-2'],
        label: ''+this.$t('dates_interval.last_n_years', {n: 3}),
      },
      {
        value: DatesIntervals['year:-3'],
        label: ''+this.$t('dates_interval.last_n_years', {n: 4}),
      },
      {
        value: DatesIntervals['year:-4'],
        label: ''+this.$t('dates_interval.last_n_years', {n: 5}),
      },
      {
        value: DatesIntervals['all'],
        label: ''+this.$t('dates_interval.all'),
      },
      {
        value: DatesIntervals['custom'],
        label: ''+this.$t('dates_interval.custom'),
      },
    ]
  }

  private get formattedValue (): string {
    if (!this.privateInterval) return ''

    if (this.privateInterval === DatesIntervals.custom) {
      const _today = moment().format(this.format)
      const dateStart = this.dateStart
        ? moment(this.dateStart).format(this.format)
        : _today
      const endDate = this.dateEnd
        ? moment(this.dateEnd).format(this.format)
        : _today

      return ''+this.$t('dates_interval.from_x_to_y', {x: dateStart, y: endDate})
    }

    const opts = this.DATES_RANGES.find(i => i.value === this.privateInterval)
    return opts?.label || ''
  }

  private mounted () {
    this.privateInterval = this.determineInterval(this.dateStart, this.dateEnd)
  }

  @Watch('interval')
  private onChangeInterval (val: DatesIntervals|null = null) {
    this.privateInterval = val
  }

  @Watch('dateStart')
  @Watch('dateEnd')
  private onChangeValue () {
    this.privateInterval = this.determineInterval(this.dateStart, this.dateEnd)
  }

  private onClickMenuOption (val: DatesIntervals = DatesIntervals.custom) {
    if (val === DatesIntervals.custom) return
    const dates = this.determineDates(val)
    this.onChange(dates)
    setTimeout(() => this.isMenuOpen = false, 50)
  }

  private onChange (dates: {dateStart: number, dateEnd: number}) {
    if (dates?.dateStart !== this.dateStart) {
      this.$emit(`update:date-start`, dates.dateStart)
    }
    if (dates?.dateEnd !== this.dateEnd) {
      this.$emit(`update:date-end`, dates.dateEnd)
    }
    this.$emit('change', dates)
    this.$emit('input', dates)
  }

  public determineInterval (
    dateStart: number,
    dateEnd: number,
    today?: number
  ): DatesIntervals {

    let interval = DatesIntervals.custom

    const _today = today ? moment.utc(today) : moment.utc()
    const _todayY = _today.year()
    const start = dateStart && moment.utc(dateStart)
    const end = dateEnd && moment.utc(dateEnd)

    if (!start && !end) return DatesIntervals.all

    const isStart_Jan1 = start && start.format('MM-DD') === `01-01`
    const isEnd_today = end && end.format('YYYY-MM-DD') === _today.format('YYYY-MM-DD')

    if (start) {
      if (isStart_Jan1 && (!end || isEnd_today)) {
        const yearsDiff = start.year() - _todayY

        // last 5 years
        if (yearsDiff <= 0 && yearsDiff >= -4) {
          interval = DatesIntervals[`year:${yearsDiff}` as DatesIntervals]
        } else {
          interval = DatesIntervals.all
        }
      }
    } else if (isEnd_today) {
      interval = DatesIntervals.all
    }

    return interval
  }

  public determineDates (
    interval: DatesIntervals,
    today?: number
  ): {dateStart: number, dateEnd: number} {

    const result = {
      dateStart: 0,
      dateEnd: 0
    }

    if ([DatesIntervals.all, DatesIntervals.custom].includes(interval)) {
      return result
    }

    const regYear = /^year:(.+)/
    const _today = today ? moment.utc(today) : moment.utc()
    _today.hours(0).minutes(0).seconds(0).milliseconds(0)

    if (regYear.test(interval)) {
      const res = regYear.exec(interval)
      const diff: number = Math.abs(Number(res?.[1] || 0))
      result.dateStart = +moment.utc(_today).year(_today.year() - diff).month(0).date(1)
      result.dateEnd = +_today
    }

    return result
  }
}
</script>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';

.dates-interval-input {
  .main-button {
    min-width: 100px !important;
    border: 0 !important;
    text-transform: none !important;
    font-weight: 400;

    i {
      font-style: normal;
      color: map-get($grey, darken-1);
    }
  }
}
</style>