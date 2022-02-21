interface TooltipParamTableItem {
  exceeded: boolean
  title: string
  source: string
  pollutant_name: string
  value: number | string
  target_value: number
  target_unit?: string
  averaging_period_name?: string
  regulation_name?: string
  class?: string
}

interface TooltipParamTableHeader {
  text: string
  value: keyof TooltipParamTableItem
  align?: string
  cellClass?: string
}

export default interface TooltipParams {
  title: string
  subtitle: string
  tableHeaders: TooltipParamTableHeader[]
  tableItems: TooltipParamTableItem[]
  numExceedViolations: number
  hasOvershoot: boolean
  hasOvershootEstimated: boolean
}
