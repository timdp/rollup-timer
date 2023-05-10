import {sum, mean, stdev} from 'stats-lite'
import Table from 'cli-table'
import ms from 'pretty-ms'
import {bold, red} from 'chalk'

const FUNCTIONS = [
  'load',
  'resolveId',
  'transform',
  'transformBundle',
  'intro',
  'outro',
  'banner',
  'footer'
]

let warnedAboutCjs = false

export default class RollupTimer {
  constructor () {
    this._timings = {}
  }

  get timings () {
    return this._timings
  }

  time (plugins) {
    return plugins.map((plugin, i) => this._time(plugin, i))
  }

  report () {
    const ids = Object.keys(this._timings)
      .filter((id) => (this._timings[id].length > 0))
    const maxSum = Math.max(0, ...ids.map((id) => sum(this._timings[id])))
    const all = Array.prototype.concat.apply([], ids.map((id) => this._timings[id]))
    const table = new Table({
      head: ['Plugin', 'Calls', 'Sum', 'Mean', 'StdDev'],
      colAligns: ['left', 'right', 'right', 'right', 'right'],
      style: {
        head: ['cyan']
      }
    })
    for (const id of ids) {
      this._addToReport(table, id, this._timings[id], maxSum)
    }
    this._addToReport(table, 'Total', all)
    console.log(table.toString())
  }

  _addToReport (table, id, data, maxSum = -1) {
    const dataSum = sum(data)
    const dataMean = mean(data)
    const dataStdev = stdev(data)
    let row = [id, data.length, ms(dataSum), ms(dataMean), ms(dataStdev)]
    if (dataSum === maxSum) {
      row = row.map((str) => red(str))
    }
    if (maxSum < 0) {
      row = row.map((str) => bold(str))
    }
    table.push(row)
  }

  _time (plugin, i) {
    const id = plugin.name || '#' + i
    const timings = this._timings[id] = []
    for (const func of FUNCTIONS.filter((func) => !!plugin[func])) {
      this._patch(plugin, func, timings)
    }
    return plugin
  }

  _patch (plugin, func, timings) {
    const that = this
    if (plugin.name === 'commonjs' && func === 'resolveId') {
      if (!warnedAboutCjs) {
        console.warn('rollup-timer: Timings for rollup-plugin-commonjs will be incomplete due to https://github.com/rollup/rollup-plugin-commonjs/issues/128')
        warnedAboutCjs = true
      }
      return
    }
    const original = plugin[func];
    if (typeof original === "function") {
      plugin[func] = function (...args) {
        const end = that._startTimer(timings);
        const res = original.apply(this, args);
        return that._handleResult(res, end);
      };
    } else {
      const hook = original.hook;
      plugin[func].hook = function (...args) {
        const end = that._startTimer(timings);
        const res = hook.apply(this, args);
        return that._handleResult(res, end);
      };
    }
  }

  _startTimer (timings) {
    const started = process.hrtime()
    return () => {
      const delta = process.hrtime(started)
      const ms = delta[0] * 1000 + delta[1] / 1e6
      timings.push(ms)
    }
  }

  _handleResult (res, end) {
    if (res != null && typeof res.then === 'function') {
      return res.then((res) => {
        end()
        return res
      })
    } else {
      end()
      return res
    }
  }
}
