export type OptionsRules = [
  test: string | RegExp,
  fn: (pixels: number, parsedVal: number, prop: string) => string
][]

export interface Options {
  /**
   * unit to convert, by default, it is px.
   *
   * @default 'px'
   */
  unitToConvert?: string

  /**
   * The width of the viewport.
   *
   * @default 320
   */
  viewportWidth?: number

  /**
   * The decimal numbers to allow the vw units to grow to.
   *
   * @default 5
   */
  unitPrecision?: number

  /**
   * The properties that can change from px to vw.
   * - Values need to be exact matches.
   * - Use wildcard `*` to enable all properties. Example: `['*']`
   * - Use `*` at the start or end of a word. (['position'] will match background-position-y)
   * - Use `!` to not match a property. Example: `['*', '!letter-spacing']`
   * - Combine the "not" prefix with the other prefixes. Example: `['', '!font']`
   *
   * @default ['*']
   */
  propList?: string[]

  /**
   * Expected units.
   *
   * @default 'vw'
   */
  viewportUnit?: string

  /**
   * Expected units for font.
   *
   * @default 'vw'
   */
  fontViewportUnit?: string

  /**
   * The selectors to ignore and leave as px.
   * - If value is string, it checks to see if selector contains the string.
   *    - `['body']` will match `.body-class`
   * - If value is regexp, it checks to see if the selector matches the regexp.
   *    - `[/^body$/]` will match body but not `.body`
   */
  selectorBlackList?: (string | RegExp)[]

  /**
   * Set the minimum pixel value to replace.
   *
   * @default 1
   */
  minPixelValue?: number

  /**
   * Allow px to be converted in media queries.
   *
   * @default false
   */
  mediaQuery?: boolean | RegExp | RegExp[]

  /**
   * replaces rules containing vw instead of adding fallbacks.
   *
   * @default true
   */
  replace?: boolean

  /**
   * Ignore some files like 'node_modules'
   *
   * - If value is regexp, will ignore the matches files.
   * - If value is array, the elements of the array are regexp.
   */
  exclude?: RegExp | RegExp[]

  /**
   * If `include` is set, only matching files will be converted, for example,
   * only files under `src/mobile/` (`include: /\/src\/mobile\//`)
   *
   * - If the value is regexp, the matching file will be included, otherwise it will be excluded.
   * - If value is array, the elements of the array are regexp.
   */
  include?: RegExp | RegExp[]

  /**
   * Adds `@media (orientation: landscape)` with values converted via `landscapeWidth`.
   *
   * @default false
   */
  landscape?: boolean

  /**
   * Expected unit for landscape option.
   *
   * @default 'vw'
   */
  landscapeUnit?: string

  /**
   * Viewport width for landscape orientation.
   *
   * @default 568
   */
  landscapeWidth?: number

  /**
   * Custom transformation rule configuration
   *
   * @example
   * ```js
   * {
   *    rules: [
   *      ['path', () => {}]
   *    ]
   * }
   * ```
   */
  rules?: OptionsRules
}
