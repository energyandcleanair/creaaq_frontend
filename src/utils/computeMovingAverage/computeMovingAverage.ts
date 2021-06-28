import { getAverage } from '../index'

type TimestampMS = number
type DatesArray = (TimestampMS|Date|null|undefined)[]

interface MovingAverageRes {
  dates: number[],
  values: (number|null)[],
}

export default function computeMovingAverage (
  dates: DatesArray,
  values: (number|null)[],
  period: number,
  minThreshold?: number,
  nullValue = null
): MovingAverageRes {

  if (dates.length !== values.length) {
    throw new Error('Dates and values array should have one length')
  }

  const _minThreshold = minThreshold || Math.round(period * 0.75)
  const average: MovingAverageRes = {
    dates: [],
    values: [],
  }

  const {
    dates: _dates,
    values: _values
  } = fillGapsInDatesArray(dates, values, nullValue)

  average.dates = _dates

  // if the period is greater than the length of the dataset
  // then return the average of the whole dataset
  if (_minThreshold > _dates.length) {
    average.values = Array(_dates.length).fill(nullValue)
    return average
  }

  for (let x = 0; x < _dates.length; x++) {
    if (x < _minThreshold - 1) {
      average.values.push(nullValue)
      continue
    }
    const from = Math.max(0, x - period + 1)
    const to = Math.min(from + period, x + 1)
    const chunk = _values.slice(from, to).filter(v => v !== nullValue) as number[]

    if (chunk.length < _minThreshold) {
      average.values.push(nullValue)
      continue
    }

    average.values.push(getAverage(chunk))
  }

  return average
}

const DAY_MS = 1000 * 60 * 60 * 24
export function fillGapsInDatesArray (
  sortedDatesArray: DatesArray,
  values: (number|null)[],
  nullValue = null
): {
    dates: number[],
    values: (number|null)[],
  } {

  if (sortedDatesArray.length !== values.length) {
    throw new Error('Dates and values array should have one length')
  }

  const resultDates: TimestampMS[] = []
  const resultValues: (number|null)[] = []

  for (const _i in sortedDatesArray) {
    const i = +_i
    const _date = sortedDatesArray[i]
    const prevDate = resultDates[resultDates.length - 1]
    const value = values[i]

    if (!_date) {
      resultDates.push(prevDate + DAY_MS)
      resultValues.push(values[i])
      continue
    }

    const date = +_date

    if (prevDate === undefined) {
      resultDates.push(+date)
      resultValues.push(value)
      continue
    }

    const prevDateDiff = date - prevDate
    if (prevDateDiff <= DAY_MS) {
      resultDates.push(date)
      resultValues.push(value)
    } else if (prevDateDiff > DAY_MS) {
      const gapDays = Math.floor(prevDateDiff / DAY_MS)
      const newDates = Array(gapDays - 1).fill(0)
        .map((_, x) => prevDate + (DAY_MS * (x + 1)))
      const newValues = Array(gapDays - 1).fill(nullValue)

      resultDates.push(...newDates)
      resultDates.push(date)
      resultValues.push(...newValues)
      resultValues.push(value)
    }
  }

  return {
    dates: resultDates,
    values: resultValues,
  }
}
