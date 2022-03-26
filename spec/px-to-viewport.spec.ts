// To run tests, run these commands from the project root:
// 1. `npm install`
// 2. `npm test`

/* global describe, it, expect */
import postcss from 'postcss'
import pxToViewport from '../src'
import { filterPropList } from '../src/prop-list-matcher'
import { toFixed } from '../src/utils'

const basicCSS = '.rule { font-size: 15px }'

describe('px-to-viewport', () => {
  it('should work on the readme example', () => {
    const input =
      'h1 { margin: 0 0 20px; font-size: 32px; line-height: 2; letter-spacing: 1px; }'
    const output =
      'h1 { margin: 0 0 6.25vw; font-size: 10vw; line-height: 2; letter-spacing: 1px; }'
    const processed = postcss(pxToViewport()).process(input).css

    expect(processed).toBe(output)
  })

  it('should replace the px unit with vw', () => {
    const processed = postcss(pxToViewport()).process(basicCSS).css
    const expected = '.rule { font-size: 4.6875vw }'

    expect(processed).toBe(expected)
  })

  it('should handle < 1 values and values without a leading 0', () => {
    const rules = '.rule { margin: 0.5rem .5px -0.2px -.2em }'
    const expected = '.rule { margin: 0.5rem 0.15625vw -0.0625vw -.2em }'
    const options = {
      minPixelValue: 0
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })

  it('should remain unitless if 0', () => {
    const expected = '.rule { font-size: 0px; font-size: 0; }'
    const processed = postcss(pxToViewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  it('should not add properties that already exist', () => {
    const expected = '.rule { font-size: 16px; font-size: 5vw; }'
    const processed = postcss(pxToViewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  it('should not replace units inside mediaQueries by default', () => {
    const expected = '@media (min-width: 500px) { .rule { font-size: 16px } }'
    const processed = postcss(pxToViewport()).process(
      '@media (min-width: 500px) { .rule { font-size: 16px } }'
    ).css

    expect(processed).toBe(expected)
  })
})

describe('value parsing', () => {
  it('should not replace values in double quotes or single quotes', () => {
    const options = {
      propList: ['*']
    }
    const rules =
      '.rule { content: \'16px\'; font-family: "16px"; font-size: 16px; }'
    const expected =
      '.rule { content: \'16px\'; font-family: "16px"; font-size: 5vw; }'
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })

  it('should not replace values in `url()`', () => {
    const rules = '.rule { background: url(16px.jpg); font-size: 16px; }'
    const expected = '.rule { background: url(16px.jpg); font-size: 5vw; }'
    const processed = postcss(pxToViewport()).process(rules).css

    expect(processed).toBe(expected)
  })

  it('should not replace values with an uppercase P or X', () => {
    const rules =
      '.rule { margin: 12px calc(100% - 14PX); height: calc(100% - 20px); font-size: 12Px; line-height: 16px; }'
    const expected =
      '.rule { margin: 3.75vw calc(100% - 14PX); height: calc(100% - 6.25vw); font-size: 12Px; line-height: 5vw; }'
    const processed = postcss(pxToViewport()).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('unitToConvert', () => {
  it('should ignore non px values by default', () => {
    const expected = '.rule { font-size: 2em }'
    const processed = postcss(pxToViewport()).process(expected).css

    expect(processed).toBe(expected)
  })

  it('should convert only values described in options', () => {
    const rules = '.rule { font-size: 5em; line-height: 2px }'
    const expected = '.rule { font-size: 1.5625vw; line-height: 2px }'
    const options = {
      unitToConvert: 'em'
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('viewportWidth', () => {
  it('should should replace using 320px by default', () => {
    const expected = '.rule { font-size: 4.6875vw }'
    const processed = postcss(pxToViewport()).process(basicCSS).css

    expect(processed).toBe(expected)
  })

  it('should replace using viewportWidth from options', () => {
    const expected = '.rule { font-size: 3.125vw }'
    const options = {
      viewportWidth: 480
    }
    const processed = postcss(pxToViewport(options)).process(basicCSS).css

    expect(processed).toBe(expected)
  })
})

describe('unitPrecision', () => {
  it('should replace using a decimal of 2 places', () => {
    const expected = '.rule { font-size: 4.69vw }'
    const options = {
      unitPrecision: 2
    }
    const processed = postcss(pxToViewport(options)).process(basicCSS).css

    expect(processed).toBe(expected)
  })
})

describe('viewportUnit', () => {
  it('should replace using unit from options', () => {
    const rules = '.rule { margin-top: 15px }'
    const expected = '.rule { margin-top: 4.6875vh }'
    const options = {
      viewportUnit: 'vh'
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('fontViewportUnit', () => {
  it('should replace only font-size using unit from options', () => {
    const rules = '.rule { margin-top: 15px; font-size: 8px; }'
    const expected = '.rule { margin-top: 4.6875vw; font-size: 2.5vmax; }'
    const options = {
      fontViewportUnit: 'vmax'
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('selectorBlackList', () => {
  it('should ignore selectors in the selector black list', () => {
    const rules = '.rule { font-size: 15px } .rule2 { font-size: 15px }'
    const expected = '.rule { font-size: 4.6875vw } .rule2 { font-size: 15px }'
    const options = {
      selectorBlackList: ['.rule2']
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })

  it('should ignore every selector with `body$`', () => {
    const rules =
      'body { font-size: 16px; } .class-body$ { font-size: 16px; } .simple-class { font-size: 16px; }'
    const expected =
      'body { font-size: 5vw; } .class-body$ { font-size: 16px; } .simple-class { font-size: 5vw; }'
    const options = {
      selectorBlackList: ['body$']
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })

  it('should only ignore exactly `body`', () => {
    const rules =
      'body { font-size: 16px; } .class-body { font-size: 16px; } .simple-class { font-size: 16px; }'
    const expected =
      'body { font-size: 16px; } .class-body { font-size: 5vw; } .simple-class { font-size: 5vw; }'
    const options = {
      selectorBlackList: [/^body$/]
    }
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('mediaQuery', () => {
  it('should replace px inside media queries if opts.mediaQuery', () => {
    const options = {
      mediaQuery: true
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (min-width: 500px) { .rule { font-size: 16px } }'
    ).css
    const expected = '@media (min-width: 500px) { .rule { font-size: 5vw } }'

    expect(processed).toBe(expected)
  })

  it('should not replace px inside media queries if not opts.mediaQuery', () => {
    const options = {
      mediaQuery: false
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (min-width: 500px) { .rule { font-size: 16px } }'
    ).css
    const expected = '@media (min-width: 500px) { .rule { font-size: 16px } }'

    expect(processed).toBe(expected)
  })

  it('should replace px inside media queries if it has params orientation landscape and landscape option', () => {
    const options = {
      mediaQuery: true,
      landscape: true
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (orientation-landscape) and (min-width: 500px) { .rule { font-size: 16px } }'
    ).css
    const expected =
      '@media (orientation-landscape) and (min-width: 500px) { .rule { font-size: 2.8169vw } }'

    expect(processed).toBe(expected)
  })

  it('should replace px inside media queries if opts.mediaQuery use RegExp', () => {
    const options = {
      mediaQuery: /min-width/
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (orientation-landscape) and (min-width: 500px) { .rule { font-size: 16px } }'
    ).css
    const expected =
      '@media (orientation-landscape) and (min-width: 500px) { .rule { font-size: 5vw } }'

    expect(processed).toBe(expected)
  })

  it('should not replace px inside media queries if opts.mediaQuery use RegExp', () => {
    const options = {
      mediaQuery: /min-width/
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (orientation-landscape) { .rule { font-size: 16px } }'
    ).css
    const expected =
      '@media (orientation-landscape) { .rule { font-size: 16px } }'

    expect(processed).toBe(expected)
  })

  it('should replace px inside media queries if opts.mediaQuery use Array of RegExp', () => {
    const options = {
      mediaQuery: [/min-width/, /max-width/]
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (max-width: 500px) { .rule { font-size: 16px } }'
    ).css
    const expected = '@media (max-width: 500px) { .rule { font-size: 5vw } }'

    expect(processed).toBe(expected)
  })

  it('should not replace px inside media queries if opts.mediaQuery use Array of RegExp', () => {
    const options = {
      mediaQuery: [/min-width/, /max-width/]
    }
    const processed = postcss(pxToViewport(options)).process(
      '@media (orientation-landscape) { .rule { font-size: 16px } }'
    ).css
    const expected =
      '@media (orientation-landscape) { .rule { font-size: 16px } }'

    expect(processed).toBe(expected)
  })
})

describe('propList', () => {
  it('should only replace properties in the prop list', () => {
    const css =
      '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }'
    const expected =
      '.rule { font-size: 5vw; margin: 5vw; margin-left: 5px; padding: 5px; padding-right: 5vw }'
    const options = {
      propList: ['*font*', 'margin*', '!margin-left', '*-right', 'pad']
    }
    const processed = postcss(pxToViewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  it('should only replace properties in the prop list with wildcard', () => {
    const css =
      '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }'
    const expected =
      '.rule { font-size: 16px; margin: 5vw; margin-left: 5px; padding: 5px; padding-right: 16px }'
    const options = {
      propList: ['*', '!margin-left', '!*padding*', '!font*']
    }
    const processed = postcss(pxToViewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  it('should replace all properties when prop list is not given', () => {
    const rules = '.rule { margin: 16px; font-size: 15px }'
    const expected = '.rule { margin: 5vw; font-size: 4.6875vw }'
    const processed = postcss(pxToViewport()).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('minPixelValue', () => {
  it('should not replace values below minPixelValue', () => {
    const options = {
      propWhiteList: [],
      minPixelValue: 2
    }
    const rules =
      '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }'
    const expected =
      '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }'
    const processed = postcss(pxToViewport(options)).process(rules).css

    expect(processed).toBe(expected)
  })
})

describe('exclude', () => {
  const rules =
    '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }'
  const covered =
    '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }'
  it('when using regex at the time, the style should not be overwritten.', () => {
    const options = {
      exclude: /\/node_modules\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/node_modules/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using regex at the time, the style should be overwritten.', () => {
    const options = {
      exclude: /\/node_modules\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/example/main.css'
    }).css

    expect(processed).toBe(covered)
  })

  it('when using array at the time, the style should not be overwritten.', () => {
    const options = {
      exclude: [/\/node_modules\//, /\/exclude\//]
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/exclude/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using array at the time, the style should be overwritten.', () => {
    const options = {
      exclude: [/\/node_modules\//, /\/exclude\//]
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/example/main.css'
    }).css

    expect(processed).toBe(covered)
  })
})

describe('include', () => {
  const rules =
    '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }'
  const covered =
    '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }'
  it('when using regex at the time, the style should not be overwritten.', () => {
    const options = {
      include: /\/mobile\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using regex at the time, the style should be overwritten.', () => {
    const options = {
      include: /\/mobile\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/main.css'
    }).css

    expect(processed).toBe(covered)
  })

  it('when using array at the time, the style should not be overwritten.', () => {
    const options = {
      include: [/\/flexible\//, /\/mobile\//]
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using array at the time, the style should be overwritten.', () => {
    const options = {
      include: [/\/flexible\//, /\/mobile\//]
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/flexible/main.css'
    }).css

    expect(processed).toBe(covered)
  })
})

describe('include-and-exclude', () => {
  const rules =
    '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }'
  const covered =
    '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }'

  it('when using regex at the time, the style should not be overwritten.', () => {
    const options = {
      include: /\/mobile\//,
      exclude: /\/not-transform\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/not-transform/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using regex at the time, the style should be overwritten.', () => {
    const options = {
      include: /\/mobile\//,
      exclude: /\/not-transform\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/style/main.css'
    }).css

    expect(processed).toBe(covered)
  })

  it('when using array at the time, the style should not be overwritten.', () => {
    const options = {
      include: [/\/flexible\//, /\/mobile\//],
      exclude: [/\/not-transform\//, /pc/]
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/flexible/not-transform/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using regex at the time, the style should be overwritten.', () => {
    const options = {
      include: [/\/flexible\//, /\/mobile\//],
      exclude: [/\/not-transform\//, /pc/]
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/mobile/style/main.css'
    }).css

    expect(processed).toBe(covered)
  })
})

describe('regex', () => {
  const rules =
    '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }'
  const covered =
    '.rule { border: 1px solid #000; font-size: 5vw; margin: 1px 3.125vw; }'

  it('when using regex at the time, the style should not be overwritten.', () => {
    const options = {
      exclude: /pc/
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using regex at the time, the style should be overwritten.', () => {
    const options = {
      exclude: /\/pc\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css

    expect(processed).toBe(covered)
  })

  it('when using regex at the time, the style should not be overwritten.', () => {
    const options = {
      include: /\/pc\//
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css

    expect(processed).toBe(rules)
  })

  it('when using regex at the time, the style should be overwritten.', () => {
    const options = {
      include: /pc/
    }
    const processed = postcss(pxToViewport(options)).process(rules, {
      from: '/pc-project/main.css'
    }).css

    expect(processed).toBe(covered)
  })
})

describe('replace', () => {
  it('should leave fallback pixel unit with root em value', () => {
    const options = {
      replace: false
    }
    const processed = postcss(pxToViewport(options)).process(basicCSS).css
    const expected = '.rule { font-size: 15px; font-size: 4.6875vw }'

    expect(processed).toBe(expected)
  })
})

describe('filter-prop-list', () => {
  it('should find "exact" matches from propList', () => {
    const propList = [
      'font-size',
      'margin',
      '!padding',
      '*border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'font-size,margin'
    expect(filterPropList.exact(propList).join()).toBe(expected)
  })

  it('should find "contain" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      '*border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'margin,border'
    expect(filterPropList.contain(propList).join()).toBe(expected)
  })

  it('should find "start" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      'border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'border'
    expect(filterPropList.startWith(propList).join()).toBe(expected)
  })

  it('should find "end" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      'border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'y'
    expect(filterPropList.endWith(propList).join()).toBe(expected)
  })

  it('should find "not" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      'border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'padding'
    expect(filterPropList.notExact(propList).join()).toBe(expected)
  })

  it('should find "not contain" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      '!border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'font'
    expect(filterPropList.notContain(propList).join()).toBe(expected)
  })

  it('should find "not start" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      '!border*',
      '*',
      '*y',
      '!*font*'
    ]
    const expected = 'border'
    expect(filterPropList.notStartWith(propList).join()).toBe(expected)
  })

  it('should find "not end" matches from propList and reduce to string', () => {
    const propList = [
      'font-size',
      '*margin*',
      '!padding',
      '!border*',
      '*',
      '!*y',
      '!*font*'
    ]
    const expected = 'y'
    expect(filterPropList.notEndWith(propList).join()).toBe(expected)
  })
})

describe('landscape', () => {
  it('should add landscape atRule', () => {
    const css =
      '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }'
    const expected =
      '.rule { font-size: 5vw; margin: 5vw; margin-left: 1.5625vw; padding: 1.5625vw; padding-right: 5vw }@media (orientation: landscape) {.rule { font-size: 2.8169vw; margin: 2.8169vw; margin-left: 0.88028vw; padding: 0.88028vw; padding-right: 2.8169vw } }'
    const options = {
      landscape: true
    }
    const processed = postcss(pxToViewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  it('should add landscape atRule with specified landscapeUnits', () => {
    const css =
      '.rule { font-size: 16px; margin: 16px; margin-left: 5px; padding: 5px; padding-right: 16px }'
    const expected =
      '.rule { font-size: 5vw; margin: 5vw; margin-left: 1.5625vw; padding: 1.5625vw; padding-right: 5vw }@media (orientation: landscape) {.rule { font-size: 2.8169vh; margin: 2.8169vh; margin-left: 0.88028vh; padding: 0.88028vh; padding-right: 2.8169vh } }'
    const options = {
      landscape: true,
      landscapeUnit: 'vh'
    }
    const processed = postcss(pxToViewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  it('should not add landscape atRule in mediaQueries', () => {
    const css = '@media (min-width: 500px) { .rule { font-size: 16px } }'
    const expected = '@media (min-width: 500px) { .rule { font-size: 5vw } }'
    const options = {
      landscape: true,
      mediaQuery: true
    }
    const processed = postcss(pxToViewport(options)).process(css).css

    expect(processed).toBe(expected)
  })

  it('should not replace values inside landscape atRule', () => {
    const options = {
      replace: false,
      landscape: true
    }
    const processed = postcss(pxToViewport(options)).process(basicCSS).css
    const expected =
      '.rule { font-size: 15px; font-size: 4.6875vw }@media (orientation: landscape) {.rule { font-size: 2.64085vw } }'

    expect(processed).toBe(expected)
  })

  it('should add landscape atRule with specified landscapeWidth', () => {
    const options = {
      landscape: true,
      landscapeWidth: 768
    }
    const processed = postcss(pxToViewport(options)).process(basicCSS).css
    const expected =
      '.rule { font-size: 4.6875vw }@media (orientation: landscape) {.rule { font-size: 1.95313vw } }'

    expect(processed).toBe(expected)
  })

  it('should not add landscape atRule if it has no nodes', () => {
    const css = '.rule { font-size: 15vw }'
    const options = {
      landscape: true
    }
    const processed = postcss(pxToViewport(options)).process(css).css
    const expected = '.rule { font-size: 15vw }'

    expect(processed).toBe(expected)
  })
})

describe('/* px-to-viewport-ignore */ & /* px-to-viewport-ignore-next */', () => {
  it('should ignore right-commented', () => {
    const css =
      '.rule { font-size: 15px; /* simple comment */ width: 100px; /* px-to-viewport-ignore */ height: 50px; }'
    const expected =
      '.rule { font-size: 4.6875vw; /* simple comment */ width: 100px; height: 15.625vw; }'

    const processed = postcss(pxToViewport()).process(css).css

    expect(processed).toBe(expected)
  })

  it('should ignore right-commented in multiline-css', () => {
    const css =
      '.rule {\n  font-size: 15px;\n  width: 100px; /*px-to-viewport-ignore*/\n  height: 50px;\n}'
    const expected =
      '.rule {\n  font-size: 4.6875vw;\n  width: 100px;\n  height: 15.625vw;\n}'

    const processed = postcss(pxToViewport()).process(css).css

    expect(processed).toBe(expected)
  })

  it('should ignore before-commented in multiline-css', () => {
    const css =
      '.rule {\n  font-size: 15px;\n  /*px-to-viewport-ignore-next*/\n  width: 100px;\n  /*px-to-viewport-ignore*/\n  height: 50px;\n}'
    const expected =
      '.rule {\n  font-size: 4.6875vw;\n  width: 100px;\n  /*px-to-viewport-ignore*/\n  height: 15.625vw;\n}'

    const processed = postcss(pxToViewport()).process(css).css

    expect(processed).toBe(expected)
  })
})

describe('rules', () => {
  it('when using regex at the time, the style should use custom rule.', () => {
    const expected = `.rule { font-size: 15vw }`

    const processed = postcss(
      pxToViewport({ rules: [[/\/node_modules\//, p => p + 'vw']] })
    ).process(basicCSS, {
      from: '/node_modules/main.css'
    }).css

    expect(processed).toBe(expected)
  })

  it('when using regex at the time, the style should not use custom rule.', () => {
    const expected = `.rule { font-size: 4.6875vw }`

    const processed = postcss(
      pxToViewport({ rules: [[/\/node_modules\//, p => p + 'vw']] })
    ).process(basicCSS, {
      from: '/example/main.css'
    }).css

    expect(processed).toBe(expected)
  })

  it('when using string at the time, the style should use custom rule.', () => {
    const expected = `.rule { font-size: 15vw }`

    const processed = postcss(
      pxToViewport({ rules: [['node_modules', p => p + 'vw']] })
    ).process(basicCSS, {
      from: '/node_modules/main.css'
    }).css

    expect(processed).toBe(expected)
  })

  it('when using string at the time, the style should not use custom rule.', () => {
    const expected = `.rule { font-size: 4.6875vw }`

    const processed = postcss(
      pxToViewport({ rules: [['node_modules', p => p + 'vw']] })
    ).process(basicCSS, {
      from: '/example/main.css'
    }).css

    expect(processed).toBe(expected)
  })

  it('when using rules,the style font prop use vmin unit', () => {
    const rules =
      '.rule { border: 1px solid #000; font-size: 16px; margin: 1px 10px; }'

    const expected =
      '.rule { border: 1px solid #000; font-size: 4.266667vmin; margin: 1px 2.666667vw; }'

    const processed = postcss(
      pxToViewport({
        rules: [
          [
            'node_modules',
            (pixels, _, prop) => {
              const parsedval = toFixed((pixels / 375) * 100, 6)
              if (prop.includes('font')) {
                return parsedval + 'vmin'
              }
              return parsedval + 'vw'
            }
          ]
        ]
      })
    ).process(rules, {
      from: '/node_modules/main.css'
    }).css

    expect(processed).toBe(expected)
  })
})
