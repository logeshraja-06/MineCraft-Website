/**
 * testSafetyGuard.js
 *
 * Safety guard to guarantee tests NEVER connect to a live or remote MongoDB database.
 * If process.env.NODE_ENV === 'test' and an attempt is made to connect to a non-in-memory URI,
 * it immediately throws an error and aborts.
 */

const mongoose = require('mongoose');

if (!global.__mongoSafetyGuardInstalled) {
  global.__mongoSafetyGuardInstalled = true;
  const originalConnect = mongoose.connect;

  mongoose.connect = function (uri, ...args) {
    if (process.env.NODE_ENV === 'test') {
      const isMemory =
        typeof uri === 'string' &&
        (uri.includes('127.0.0.1') || uri.includes('localhost') || uri.startsWith('mongodb-memory-server')) &&
        !uri.includes('mongodb.net') &&
        !uri.includes('cluster');

      if (!isMemory) {
        const errorMsg = `[CRITICAL SAFETY GUARD] Blocked attempt to connect to live/remote MongoDB during testing: "${uri}". Tests must use mongodb-memory-server only!`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    return originalConnect.call(this, uri, ...args);
  };
}
