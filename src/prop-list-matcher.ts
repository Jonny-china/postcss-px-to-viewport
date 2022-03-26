export const filterPropList = {
  exact(list: string[]) {
    return list.filter(m => m.match(/^[^*!]+$/))
  },
  contain(list: string[]) {
    return list
      .filter(m => m.match(/^\*.+\*$/))
      .map(m => m.substring(1, m.length - 1))
  },
  endWith: function (list: string[]) {
    return list.filter(m => m.match(/^\*[^*]+$/)).map(m => m.substring(1))
  },
  startWith: function (list: string[]) {
    return list
      .filter(m => m.match(/^[^*!]+\*$/))
      .map(m => m.substring(0, m.length - 1))
  },
  notExact: function (list: string[]) {
    return list.filter(m => m.match(/^![^*].*$/)).map(m => m.substring(1))
  },
  notContain: function (list: string[]) {
    return list
      .filter(m => m.match(/^!\*.+\*$/))
      .map(m => m.substring(2, m.length - 1))
  },
  notEndWith: function (list: string[]) {
    return list.filter(m => m.match(/^!\*[^*]+$/)).map(m => m.substring(2))
  },
  notStartWith: function (list: string[]) {
    return list
      .filter(m => m.match(/^![^*]+\*$/))
      .map(m => m.substring(1, m.length - 1))
  }
}

export function createPropListMatcher(propList: string[]) {
  const hasWild = propList.indexOf('*') > -1
  const matchAll = hasWild && propList.length === 1
  const lists = {
    exact: filterPropList.exact(propList),
    contain: filterPropList.contain(propList),
    startWith: filterPropList.startWith(propList),
    endWith: filterPropList.endWith(propList),
    notExact: filterPropList.notExact(propList),
    notContain: filterPropList.notContain(propList),
    notStartWith: filterPropList.notStartWith(propList),
    notEndWith: filterPropList.notEndWith(propList)
  }
  return function (prop: string) {
    if (matchAll) return true
    return (
      (hasWild ||
        lists.exact.indexOf(prop) > -1 ||
        lists.contain.some(m => prop.indexOf(m) > -1) ||
        lists.startWith.some(m => prop.indexOf(m) === 0) ||
        lists.endWith.some(m => prop.indexOf(m) === prop.length - m.length)) &&
      !(
        lists.notExact.indexOf(prop) > -1 ||
        lists.notContain.some(m => prop.indexOf(m) > -1) ||
        lists.notStartWith.some(m => prop.indexOf(m) === 0) ||
        lists.notEndWith.some(m => prop.indexOf(m) === prop.length - m.length)
      )
    )
  }
}
