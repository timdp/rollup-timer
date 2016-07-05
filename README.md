# rollup-timer

[![npm](https://img.shields.io/npm/v/rollup-timer.svg)](https://www.npmjs.com/package/rollup-timer) [![Dependencies](https://img.shields.io/david/timdp/rollup-timer.svg)](https://david-dm.org/timdp/rollup-timer) [![Build Status](https://img.shields.io/travis/timdp/rollup-timer/master.svg)](https://travis-ci.org/timdp/rollup-timer) [![Coverage Status](https://img.shields.io/coveralls/timdp/rollup-timer/master.svg)](https://coveralls.io/r/timdp/rollup-timer) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

Times Rollup plugins by monkey-patching plugin API functions.

## Installation

```bash
npm i --save-dev rollup-timer
```

## Usage

Wrap your `plugins` array in `.time()` and call `.report()` after `rollup()`.

```js
import RollupTimer from 'rollup-timer'
import {rollup} from 'rollup'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

const timer = new RollupTimer()
rollup({
  plugins: timer.time([ // ← Look here
    nodeResolve({jsnext: true, main: true}),
    commonjs({include: 'node_modules/**'})
  ])
}).then(() => {
  timer.report()
})
```

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
