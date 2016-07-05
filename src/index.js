import {sum, mean, stdev} from 'stats-lite'
import Table from 'cli-table'
import ms from 'pretty-ms'
import {bold} from 'chalk'

const FUNCTIONS = ['load', 'resolveId', 'transform', 'transformBundle']

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
    const timings = this._timings
    const table = new Table({
      head: ['Plugin', 'Calls', 'Sum', 'Mean', 'StdDev']
    })
    for (const id of Object.keys(timings)) {
      this._addToReport(table, id, timings[id])
    }
    const all = Array.prototype.concat.apply([],
      Object.keys(timings).map((id) => timings[id]))
    this._addToReport(table, 'Total', all, bold)
    console.log(table.toString())
  }

  _addToReport (table, id, t, fmt = null) {
    const row = [id, t.length, ms(sum(t)), ms(mean(t)), ms(stdev(t))]
    table.push(fmt ? row.map((str) => fmt(str)) : row)
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
    const original = plugin[func]
    plugin[func] = function (...args) {
      const end = that._startTimer(timings)
      const res = original.apply(this, args)
      return that._handleResult(res, end)
    }
  }

  _startTimer (timings) {
    const started = Date.now()
    return () => {
      const time = Date.now() - started
      timings.push(time)
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
