import moment from 'moment'
import {shallowMount, Wrapper} from '@vue/test-utils'
import DatesIntervalInput from './DatesIntervalInput.vue'
import DatesIntervals from './DatesIntervals'

describe('DatesIntervalInput.vue', () => {
  let wrapper: Wrapper<DatesIntervalInput>
  const today = moment
    .utc()
    .year(2021)
    .month(6)
    .date(21)
    .hours(0)
    .minutes(0)
    .seconds(0)
    .milliseconds(0)

  beforeEach(() => {
    wrapper = shallowMount(DatesIntervalInput, {
      mocks: {
        $t: () => {},
      },
      stubs: [
        'v-select',
        'v-container',
        'v-row',
        'v-col',
        'v-menu',
        'v-list',
        'v-list-item',
        'v-card',
        'v-card-title',
        'v-card-text',
        'v-date-picker',
      ],
      propsData: {},
    })
  })

  it('determine the interval by dates  (case: this year)', () => {
    const vm: any = wrapper.findComponent(DatesIntervalInput).vm

    const case1 = () => {
      const dateStart = +moment.utc().year(today.year()).month(0).date(1)
      const endDate = +today
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case2 = () => {
      const dateStart = +moment.utc().year(today.year()).month(0).date(1)
      const endDate = 0
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    expect(case1()).toBe(DatesIntervals['year:0'])
    expect(case2()).toBe(DatesIntervals['year:0'])
  })

  it('determine the interval by dates  (case: last 2 years)', () => {
    const vm: any = wrapper.findComponent(DatesIntervalInput).vm

    const case1 = () => {
      const dateStart = +moment
        .utc()
        .year(today.year() - 1)
        .month(0)
        .date(1)
      const endDate = +today
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case2 = () => {
      const dateStart = +moment
        .utc()
        .year(today.year() - 1)
        .month(0)
        .date(1)
      const endDate = 0
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    expect(case1()).toBe(DatesIntervals['year:-1'])
    expect(case2()).toBe(DatesIntervals['year:-1'])
  })

  it('determine the interval by dates  (case: last 5 years)', () => {
    const vm: any = wrapper.findComponent(DatesIntervalInput).vm

    const case1 = () => {
      const dateStart = +moment
        .utc()
        .year(today.year() - 4)
        .month(0)
        .date(1)
      const endDate = +today
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case2 = () => {
      const dateStart = +moment
        .utc()
        .year(today.year() - 4)
        .month(0)
        .date(1)
      const endDate = 0
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    expect(case1()).toBe(DatesIntervals['year:-4'])
    expect(case2()).toBe(DatesIntervals['year:-4'])
  })

  it('determine the interval by dates  (case: custom)', () => {
    const vm: any = wrapper.findComponent(DatesIntervalInput).vm

    const case1 = () => {
      const dateStart = +moment.utc().year(today.year()).month(0).date(2)
      const endDate = +moment.utc().year(today.year()).month(9).date(12)
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case2 = () => {
      const dateStart = +moment.utc().year(today.year()).month(0).date(2)
      const endDate = 0
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case3 = () => {
      const dateStart = 0
      const endDate = +moment
        .utc()
        .year(today.year() + 4)
        .month(12)
        .date(30)
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    expect(case1()).toBe(DatesIntervals['custom'])
    expect(case2()).toBe(DatesIntervals['custom'])
    expect(case3()).toBe(DatesIntervals['custom'])
  })

  it('determine the interval by dates  (case: all historical data)', () => {
    const vm: any = wrapper.findComponent(DatesIntervalInput).vm

    const case1 = () => {
      const dateStart = +moment
        .utc()
        .year(today.year() - 100)
        .month(0)
        .date(1)
      const endDate = +today
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case2 = () => {
      const dateStart = 0
      const endDate = +today
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    const case3 = () => {
      const dateStart = 0
      const endDate = 0
      const interval: DatesIntervals = vm.determineInterval(
        dateStart,
        endDate,
        +today
      )
      return interval
    }

    expect(case1()).toBe(DatesIntervals['all'])
    expect(case2()).toBe(DatesIntervals['all'])
    expect(case3()).toBe(DatesIntervals['all'])
  })

  it('determine the dates by interval', () => {
    const vm: any = wrapper.findComponent(DatesIntervalInput).vm

    const case1 = () => {
      const dates: {dateStart: number; dateEnd: number} = vm.determineDates(
        DatesIntervals['year:0'],
        +today
      )

      const dateStart = +moment.utc(today).year(today.year()).month(0).date(1)
      const endDate = +today

      expect(dates.dateStart).toBe(dateStart)
      expect(dates.dateEnd).toBe(endDate)
    }

    const case2 = () => {
      const dates: {dateStart: number; dateEnd: number} = vm.determineDates(
        DatesIntervals['year:-1'],
        +today
      )

      const dateStart = +moment
        .utc(today)
        .year(today.year() - 1)
        .month(0)
        .date(1)
      const endDate = +today

      expect(dates.dateStart).toBe(dateStart)
      expect(dates.dateEnd).toBe(endDate)
    }

    const case3 = () => {
      const dates: {dateStart: number; dateEnd: number} = vm.determineDates(
        DatesIntervals['year:-4'],
        +today
      )

      const dateStart = +moment
        .utc(today)
        .year(today.year() - 4)
        .month(0)
        .date(1)
      const endDate = +today

      expect(dates.dateStart).toBe(dateStart)
      expect(dates.dateEnd).toBe(endDate)
    }

    const case4 = () => {
      const dates: {dateStart: number; dateEnd: number} = vm.determineDates(
        DatesIntervals['all'],
        +today
      )

      const dateStart = 0
      const endDate = 0

      expect(dates.dateStart).toBe(dateStart)
      expect(dates.dateEnd).toBe(endDate)
    }

    const case5 = () => {
      const dates: {dateStart: number; dateEnd: number} = vm.determineDates(
        DatesIntervals['custom'],
        +today
      )

      const dateStart = 0
      const endDate = 0

      expect(dates.dateStart).toBe(dateStart)
      expect(dates.dateEnd).toBe(endDate)
    }

    case1()
    case2()
    case3()
    case4()
    case5()
  })
})
