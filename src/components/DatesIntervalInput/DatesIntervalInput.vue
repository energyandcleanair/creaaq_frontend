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
      <template v-slot:activator="{on, attrs}">
        <label
          v-if="label"
          class="dates-interval-input__label caption grey--text text--darken-2"
          v-bind="attrs"
          v-on="on"
        >
          {{ label }}
        </label>

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
                      <template v-slot:activator="{on, attrs}">
                        <v-text-field
                          :value="
                            privateInterval === 'all' ? '' : dateStartFormat
                          "
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
                        @input="
                          ($e) => {
                            onChange({dateStart: +new Date($e), dateEnd})
                            isMenuDateStartOpen = false
                          }
                        "
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
                      <template v-slot:activator="{on, attrs}">
                        <v-text-field
                          :value="
                            privateInterval === 'all' ? '' : dateEndFormat
                          "
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
                        @input="
                          ($e) => {
                            onChange({dateStart, dateEnd: +new Date($e)})
                            isMenuDateEndOpen = false
                          }
                        "
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
import {mdiCalendar} from '@mdi/js'
import moment from 'moment'
import {Vue, Component, Prop, Watch} from 'vue-property-decorator'
import i18n from '@/plugins/i18n'
import DatesIntervals from './DatesIntervals'
import DateInterval from './DateInterval'

@Component
export default class DatesIntervalInput extends Vue {
  @Prop({type: String, required: false})
  readonly interval!: DatesIntervals

  @Prop({type: String, required: false})
  readonly label?: string

  @Prop({type: Number, default: 0})
  readonly dateStart!: number

  @Prop({type: Number, default: 0})
  readonly dateEnd!: number

  @Prop({type: Boolean, default: false})
  readonly disabled!: boolean

  @Prop({type: Boolean, default: false})
  readonly loading!: boolean

  @Prop({type: String, default: 'YYYY-MM-DD'})
  readonly format!: string

  public mdiCalendar = mdiCalendar
  public privateInterval: DatesIntervals | null = null
  public isMenuOpen: boolean = false
  public isMenuDateStartOpen: boolean = false
  public isMenuDateEndOpen: boolean = false

  public get dateStartFormat(): string {
    return moment.utc(this.dateStart).format(this.format)
  }

  public get dateEndFormat(): string {
    return moment.utc(this.dateEnd).format(this.format)
  }

  public get maxDate(): string {
    return moment().format('YYYY-MM-DD')
  }

  public get datePickersRules(): any {
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

  public get DATES_RANGES(): DateInterval[] {
    return DatesIntervalInput.DATES_RANGES
  }

  public get formattedValue(): string {
    if (!this.privateInterval) return ''
    return DatesIntervalInput.formatValue(
      this.privateInterval,
      this.dateStart,
      this.dateEnd,
      this.format
    )
  }

  public mounted() {
    this.privateInterval = this.determineInterval(this.dateStart, this.dateEnd)
  }

  @Watch('interval')
  public onChangeInterval(val: DatesIntervals | null = null) {
    this.privateInterval = val
  }

  @Watch('dateStart')
  @Watch('dateEnd')
  public onChangeValue() {
    this.privateInterval = this.determineInterval(this.dateStart, this.dateEnd)
  }

  public onClickMenuOption(val: DatesIntervals = DatesIntervals.custom) {
    if (val === DatesIntervals.custom) return
    const dates = this.determineDates(val)
    this.onChange(dates)
    setTimeout(() => (this.isMenuOpen = false), 50)
  }

  public onChange(dates: {dateStart: number; dateEnd: number}) {
    if (dates?.dateStart !== this.dateStart) {
      this.$emit(`update:date-start`, dates.dateStart)
    }
    if (dates?.dateEnd !== this.dateEnd) {
      this.$emit(`update:date-end`, dates.dateEnd)
    }
    this.$emit('change', dates)
    this.$emit('input', dates)
  }

  public determineInterval(
    dateStart: number,
    dateEnd: number,
    today?: number
  ): DatesIntervals {
    return DatesIntervalInput.determineInterval(dateStart, dateEnd, today)
  }

  public determineDates(
    interval: DatesIntervals,
    today?: number
  ): {dateStart: number; dateEnd: number} {
    const result = {
      dateStart: 0,
      dateEnd: 0,
    }

    if ([DatesIntervals.all, DatesIntervals.custom].includes(interval)) {
      return result
    }

    const regYear = /^year:(.+)/
    const _today = today ? moment.utc(today) : moment.utc()
    _today
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0)

    if (regYear.test(interval)) {
      const res = regYear.exec(interval)
      const diff: number = Math.abs(Number(res?.[1] || 0))
      result.dateStart = +moment
        .utc(_today)
        .year(_today.year() - diff)
        .month(0)
        .date(1)
      result.dateEnd = +_today
    }

    return result
  }

  static DATES_RANGES = [
    {
      value: DatesIntervals['year:0'],
      label: '' + i18n.t('dates_interval.this_year'),
    },
    {
      value: DatesIntervals['year:-1'],
      label: '' + i18n.t('dates_interval.last_n_years', {n: 2}),
    },
    {
      value: DatesIntervals['year:-2'],
      label: '' + i18n.t('dates_interval.last_n_years', {n: 3}),
    },
    {
      value: DatesIntervals['year:-3'],
      label: '' + i18n.t('dates_interval.last_n_years', {n: 4}),
    },
    {
      value: DatesIntervals['year:-4'],
      label: '' + i18n.t('dates_interval.last_n_years', {n: 5}),
    },
    {
      value: DatesIntervals['all'],
      label: '' + i18n.t('dates_interval.all'),
    },
    {
      value: DatesIntervals['custom'],
      label: '' + i18n.t('dates_interval.custom'),
    },
  ]

  static formatValue(
    privateInterval: DatesIntervals,
    dateStart: number,
    dateEnd: number,
    format: string
  ): string {
    if (!privateInterval) return ''

    if (privateInterval === DatesIntervals.custom) {
      const _today = moment().format(format)
      const _dateStart = dateStart ? moment(dateStart).format(format) : _today
      const _endDate = dateEnd ? moment(dateEnd).format(format) : _today

      return (
        '' + i18n.t('dates_interval.from_x_to_y', {x: _dateStart, y: _endDate})
      )
    }

    const opts = DatesIntervalInput.DATES_RANGES.find(
      (i) => i.value === privateInterval
    )
    return opts?.label || ''
  }

  static determineInterval(
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
    const isEnd_today =
      end && end.format('YYYY-MM-DD') === _today.format('YYYY-MM-DD')

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
}
</script>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';

.dates-interval-input {
  position: relative;
  padding-top: 0.9em;

  &__label {
    position: absolute;
    left: 0;
    top: -0.1em;
    z-index: 3;
  }

  .main-button {
    margin-top: 0.3em;
    min-width: 100px !important;
    border: 0 !important;
    text-transform: none !important;
    font-weight: 400;
    letter-spacing: 0.4px !important;

    i {
      font-style: normal;
      color: map-get($grey, darken-1);
    }
  }
}
</style>
