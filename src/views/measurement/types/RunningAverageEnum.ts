enum RunningAverageEnum {
  '1d' = '1d',
  '7d' = '7d',
  '14d' = '14d',
  '1m' = '1m',
  '1Q' = '1Q',
  '1Y' = '1Y',
}

export type RunningAverageDaysMap = Record<RunningAverageEnum, number>
export const RUNNING_AVERAGE_DAYS_MAP: RunningAverageDaysMap = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '1m': 30,
  '1Q': 90,
  '1Y': 365,
}

export default RunningAverageEnum
