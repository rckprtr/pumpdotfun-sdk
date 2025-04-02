import assert from 'node:assert';

import { PumpFunSDK } from '../dist/esm/index.mjs';

assert.ok(PumpFunSDK, 'PumpFunSDK should be defined');
assert.strictEqual(typeof PumpFunSDK, 'function', 'PumpFunSDK should be a class (function)');
assert.strictEqual(PumpFunSDK.name, 'PumpFunSDK', 'PumpFunSDK should have the name "PumpFunSDK"');
