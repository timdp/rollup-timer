import isPromise from 'is-promise'
import isStream from 'is-stream'
import RollupTimer from './rollup-timer'

const handleResult = (result, timer) => {
  if (isPromise(result)) {
    return result.then((value) => {
      timer.report()
      return value
    })
  }
  if (isStream(result)) {
    return result.once('end', () => {
      timer.report()
    })
  }
  throw new Error('Expected a thenable or a stream')
}

const wrap = (rollup) => {
  const timer = new RollupTimer()
  return function (options) {
    const patch = Array.isArray(options.plugins)
    if (patch) {
      options.plugins = timer.time(options.plugins)
    }
    const result = rollup.call(this, options)
    return patch ? handleResult(result, timer) : result
  }
}

const time = (rollup) => {
  if (typeof rollup === 'function') {
    return wrap(rollup)
  } else if (rollup != null && typeof rollup.rollup === 'function') {
    rollup.rollup = wrap(rollup.rollup)
    return rollup
  } else {
    throw new Error('Need either the rollup function or the rollup exports object')
  }
}

export {RollupTimer}

export default time
