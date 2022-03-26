import { AtRule, ChildNode, Container, Declaration, Rule } from 'postcss'
import { Options } from './type'

export function getUnit(prop: string, opts: Options): string {
  return prop.indexOf('font') === -1
    ? opts.viewportUnit!
    : opts.fontViewportUnit!
}

export function createPxReplace(
  opts: Options,
  viewportUnit: string,
  viewportSize: number,
  decl: Declaration
) {
  const path = decl.source?.input.file

  const [, fn] =
    opts.rules?.find(([test]) => {
      if (typeof test === 'string') {
        return path?.includes(test)
      }
      return test.test(path!)
    }) ?? []

  return function (m: string, $1: string) {
    if (!$1) return m
    const pixels = parseFloat($1)
    if (pixels <= opts.minPixelValue!) return m
    const parsedVal = toFixed(
      (pixels / viewportSize) * 100,
      opts.unitPrecision!
    )
    const customValue = fn?.(pixels, parsedVal, decl.prop)
    if (customValue) return customValue

    return parsedVal === 0 ? '0' : parsedVal + viewportUnit
  }
}

export function checkRegExpOrArray(
  options: Options,
  optionName: 'include' | 'exclude'
) {
  const option = options[optionName]
  if (!option) return
  if (option instanceof RegExp) return
  if (Array.isArray(option) && option.every(v => v instanceof RegExp)) return
  throw new Error(
    'options.' + optionName + ' should be RegExp or Array of RegExp.'
  )
}

export function checkMediaQuery(mediaQuery: boolean | RegExp | RegExp[]) {
  if (!mediaQuery || typeof mediaQuery === 'boolean') return
  if (mediaQuery instanceof RegExp) return
  if (Array.isArray(mediaQuery) && mediaQuery.every(v => v instanceof RegExp))
    return
  throw new Error(
    'options.mediaQuery should be boolean or RegExp or Array of RegExp.'
  )
}

export function toFixed(number: number, precision: number) {
  const multiplier = Math.pow(10, precision + 1)
  const wholeNumber = Math.floor(number * multiplier)
  return (Math.round(wholeNumber / 10) * 10) / multiplier
}

export function declarationExists(
  decls: Container<ChildNode>,
  prop: string,
  value: string
) {
  return decls.some(decl => {
    return (
      (decl as Declaration).prop === prop &&
      (decl as Declaration).value === value
    )
  })
}

export function validateParams(
  params: string,
  mediaQuery: boolean | RegExp | RegExp[]
) {
  if (mediaQuery instanceof RegExp) {
    return mediaQuery.test(params)
  }
  if (Array.isArray(mediaQuery)) {
    return mediaQuery.some(rule => rule.test(params))
  }
  return !params || (params && mediaQuery)
}

export function blacklistedSelector(
  blacklist: Options['selectorBlackList'],
  selector: string
) {
  if (typeof selector !== 'string') return
  return blacklist?.some(regex => {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1
    return selector.match(regex)
  })
}

export function validateRule(opts: Options, rule: Rule | AtRule) {
  // Add exclude option to ignore some files like 'node_modules'
  const file = rule.source?.input.file

  if (opts.include && file) {
    if (opts.include instanceof RegExp) {
      if (!opts.include.test(file)) return
    } else if (
      Array.isArray(opts.include) &&
      !opts.include.some(v => v.test(file))
    ) {
      return
    }
  }

  if (opts.exclude && file) {
    if (opts.exclude instanceof RegExp) {
      if (opts.exclude.test(file)) return false
    } else if (
      Array.isArray(opts.exclude) &&
      opts.exclude.some(v => v.test(file))
    ) {
      return false
    }
  }

  if (blacklistedSelector(opts.selectorBlackList!, (rule as Rule).selector))
    return false

  return true
}

const processd = Symbol('processed')

export function isRepeatRun(r: Rule | Declaration | AtRule) {
  if ((r as unknown as Record<symbol, boolean>)[processd]) {
    return true
  }
  ;(r as unknown as Record<symbol, boolean>)[processd] = true
  return false
}
