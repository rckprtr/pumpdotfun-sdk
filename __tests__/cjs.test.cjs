'use strict';

const assert = require('node:assert');

const { PumpFunSDK } = require('../dist/cjs/index.cjs');

assert.ok(PumpFunSDK, 'PumpFunSDK should be defined');
assert.strictEqual(typeof PumpFunSDK, 'function', 'PumpFunSDK should be a class (function)');
assert.strictEqual(PumpFunSDK.name, 'PumpFunSDK', 'PumpFunSDK should have the name "PumpFunSDK"');
