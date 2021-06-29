import moment from 'moment'
import { getAverage } from '../index'
import computeMovingAverage, { fillGapsInDatesArray } from './computeMovingAverage'

describe('utils.computeMovingAverage', () => {
  it('fillGapsInDatesArray', () => {
    const inputData = [
      {x: 'Jan-01', y: 1},
      {x: 'Jan-02', y: 2},
      // gap
      {x: 'Jan-04', y: 3},
      {x: null, y: 4},
      {x: undefined, y: 5},
      {x: 0, y: null},
      {x: NaN, y: 7},
      // gap
      {x: 'Jan-10', y: 8},
    ]
    const dates = inputData.map(itm => +moment(itm.x, 'MMM-DD'))
    const values = inputData.map(itm => itm.y)

    const expectedDates = Array(10).fill(0)
      .map((_, i) => +moment(0).year(0).month(0).date(i + 1))

    const expectedValues = [
      1,
      2,
      null,
      3,
      4,
      5,
      null,
      7,
      null,
      8,
    ]

    const result = fillGapsInDatesArray(dates, values)
    const expectedDatesHash = expectedDates.map(itm => moment(itm).format('MMM-DD')).join(',')
    const resultDatesHash = result.dates.map(itm => moment(itm).format('MMM-DD')).join(',')

    const expectedValuesHash = expectedValues.map(itm => String(itm)).join(',')
    const resultValuesHash = result.values.map(itm => String(itm)).join(',')

    expect(resultDatesHash).toBe(expectedDatesHash)
    expect(resultValuesHash).toBe(expectedValuesHash)
  })

  it('should calculate the moving average for an array with the gaps', () => {
    const inputData = [
      {x: 'Jan-01', y: 10},
      {x: 'Jan-02', y: 20},
      {x: 'Jan-03', y: 30},
      {x: 'Jan-04', y: 40},
      {x: 'Jan-05', y: 50},
      {x: 'Jan-06', y: 60},
      // gap 'Jan-07'
      // gap 'Jan-08'
      // gap 'Jan-09'
      {x: 'Jan-10', y: 100},
      {x: 'Jan-11', y: 110},
      {x: 'Jan-12', y: 120},
      {x: 'Jan-13', y: 130},
    ]
    const dates = inputData.map(itm => +moment(itm.x, 'MMM-DD').hours(12))
    const values = inputData.map(itm => itm.y)

    const expectedData = [
      {x: 'Jan-01', y: null},
      {x: 'Jan-02', y: null},
      {x: 'Jan-03', y: getAverage([10, 20, 30])},
      {x: 'Jan-04', y: getAverage([10, 20, 30, 40])},
      {x: 'Jan-05', y: getAverage([10, 20, 30, 40, 50])},
      {x: 'Jan-06', y: getAverage([20, 30, 40, 50, 60])},
      {x: 'Jan-07', y: getAverage([30, 40, 50, 60])},
      {x: 'Jan-08', y: getAverage([40, 50, 60])},
      {x: 'Jan-09', y: null},
      {x: 'Jan-10', y: null},
      {x: 'Jan-11', y: null},
      {x: 'Jan-12', y: getAverage([100, 110, 120])},
      {x: 'Jan-13', y: getAverage([100, 110, 120, 130])},
    ]
    const expectedDates = expectedData.map(itm => +moment(itm.x, 'MMM-DD').hours(12))
    const expectedValues = expectedData.map(itm => itm.y)

    const result = computeMovingAverage(dates, values, 5, 3)

    const expectedDatesHash = expectedDates.map(itm => moment(itm).format('MMM-DD')).join(',')
    const resultDatesHash = result.dates.map(itm => moment(itm).format('MMM-DD')).join(',')

    const expectedValuesHash = expectedValues.map(itm => String(itm)).join(',')
    const resultValuesHash = result.values.map(itm => String(itm)).join(',')

    expect(resultDatesHash).toBe(expectedDatesHash)
    expect(resultValuesHash).toBe(expectedValuesHash)
  })

  it('should calculate the moving average for a short array', () => {
    const inputData = [
      {x: 'Jan-01', y: 10},
      {x: 'Jan-02', y: 20},
      {x: 'Jan-03', y: 30},
    ]
    const dates = inputData.map(itm => +moment(itm.x, 'MMM-DD').hours(12))
    const values = inputData.map(itm => itm.y)

    const expectedData = [
      {x: 'Jan-01', y: null},
      {x: 'Jan-02', y: null},
      {x: 'Jan-03', y: null},
    ]
    const expectedDates = expectedData.map(itm => +moment(itm.x, 'MMM-DD').hours(12))
    const expectedValues = expectedData.map(itm => itm.y)

    const result = computeMovingAverage(dates, values, 7, 5)

    const expectedDatesHash = expectedDates.map(itm => moment(itm).format('MMM-DD')).join(',')
    const resultDatesHash = result.dates.map(itm => moment(itm).format('MMM-DD')).join(',')

    const expectedValuesHash = expectedValues.map(itm => String(itm)).join(',')
    const resultValuesHash = result.values.map(itm => String(itm)).join(',')

    expect(resultDatesHash).toBe(expectedDatesHash)
    expect(resultValuesHash).toBe(expectedValuesHash)
  })
})
