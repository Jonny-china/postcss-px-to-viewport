import { AtRule, Plugin, Rule } from 'postcss'
import { createPropListMatcher } from './prop-list-matcher'
import { getUnitRegexp } from './pixel-unit-regexp'
import {
  getUnit,
  createPxReplace,
  checkRegExpOrArray,
  declarationExists,
  validateParams,
  validateRule,
  isRepeatRun,
  checkMediaQuery
} from './utils'
import { Options } from './type'

const defaults: Required<Omit<Options, 'exclude' | 'include' | 'rules'>> = {
  unitToConvert: 'px',
  viewportWidth: 320,
  // viewportHeight: 568, // not now used; TODO: need for different units and math for different properties
  unitPrecision: 5,
  viewportUnit: 'vw',
  fontViewportUnit: 'vw', // vmin is more suitable.
  selectorBlackList: [],
  propList: ['*'],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 568
}

const ignoreNextComment = 'px-to-viewport-ignore-next'
const ignorePrevComment = 'px-to-viewport-ignore'

function pxToViewport(options?: Options) {
  const opts: Options = {
    ...defaults,
    ...(options ?? {})
  }

  checkRegExpOrArray(opts, 'exclude')
  checkRegExpOrArray(opts, 'include')
  checkMediaQuery(opts.mediaQuery!)

  const pxRegex = getUnitRegexp(opts.unitToConvert!)
  const satisfyPropList = createPropListMatcher(opts.propList ?? [])
  const landscapeRules: Rule[] = []

  const plugin: Plugin = {
    postcssPlugin: 'postcss-px-to-viewport',
    prepare() {
      let landscapeRule: Rule | undefined
      return {
        Declaration(decl, { Warning }) {
          if (isRepeatRun(decl)) return

          const rule = decl.parent! as Rule
          if (!validateRule(opts, rule)) return

          const params = (rule.parent as AtRule).params

          if (decl.value.indexOf(opts.unitToConvert!) === -1) return
          if (!satisfyPropList(decl.prop)) return

          if (opts.landscape && !params) {
            landscapeRule?.append(
              decl.clone({
                value: decl.value.replace(
                  pxRegex,
                  createPxReplace(
                    opts,
                    opts.landscapeUnit!,
                    opts.landscapeWidth!,
                    decl
                  )
                )
              })
            )
          }

          if (!validateParams(params, opts.mediaQuery!)) return

          if (decl.value.indexOf(opts.unitToConvert!) === -1) return
          if (!satisfyPropList(decl.prop)) return

          const prev = decl.prev()
          // prev declaration is ignore conversion comment at same line
          if (
            prev &&
            prev.type === 'comment' &&
            prev.text === ignoreNextComment
          ) {
            // remove comment
            prev.remove()
            return
          }
          const next = decl.next()
          // next declaration is ignore conversion comment at same line
          if (
            next &&
            next.type === 'comment' &&
            next.text === ignorePrevComment
          ) {
            if (/\n/.test(next.raws.before!)) {
              new Warning(
                'Unexpected comment /* ' +
                  ignorePrevComment +
                  ' */ must be after declaration at same line.',
                { node: next }
              )
            } else {
              // remove comment
              next.remove()
              return
            }
          }

          let unit
          let size
          if (opts.landscape && params && params.indexOf('landscape') !== -1) {
            unit = opts.landscapeUnit!
            size = opts.landscapeWidth!
          } else {
            unit = getUnit(decl.prop, opts)
            size = opts.viewportWidth!
          }

          const value = decl.value.replace(
            pxRegex,
            createPxReplace(opts, unit, size, decl)
          )

          if (declarationExists(decl.parent!, decl.prop, value)) return

          if (opts.replace) {
            decl.value = value
          } else {
            decl.parent?.insertAfter(decl, decl.clone({ value }))
          }
        },
        Rule(rule) {
          if (isRepeatRun(rule)) return

          if (!validateRule(opts, rule)) return

          const params = (rule.parent as AtRule).params

          if (opts.landscape && !params) {
            landscapeRule = rule.clone().removeAll()
          }
        },
        RuleExit(rule) {
          const params = (rule.parent as AtRule).params
          if (opts.landscape && !params && landscapeRule?.nodes?.length) {
            landscapeRules.push(landscapeRule)
            landscapeRule = undefined
          }
        },
        OnceExit(css, { AtRule }) {
          if (landscapeRules.length > 0) {
            const landscapeRoot = new AtRule({
              params: '(orientation: landscape)',
              name: 'media'
            })

            landscapeRules.forEach(function (rule) {
              landscapeRoot.append(rule)
            })
            css.append(landscapeRoot)
          }
        }
      }
    }
  }
  return plugin
}

pxToViewport.postcss = true

export = pxToViewport
