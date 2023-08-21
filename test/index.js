
/* IMPORT */

import {describe} from 'fava';
import DotLocker from '../dist/index.js';

/* HELPERS */

const TARGET_PATH = 'test';

/* MAIN */

//TODO: Add more tests

describe ( 'DotLocker', it => {

  it ( 'can handle a lock asynchronously', async t => {

    t.false ( await DotLocker.locked ( TARGET_PATH ) );

    await DotLocker.lock ( TARGET_PATH );

    t.true ( await DotLocker.locked ( TARGET_PATH ) );

    await DotLocker.unlock ( TARGET_PATH );

    t.false ( await DotLocker.locked ( TARGET_PATH ) );

  });

  it ( 'can handle a lock synchronously', t => {

    t.false ( DotLocker.lockedSync ( TARGET_PATH ) );

    DotLocker.lockSync ( TARGET_PATH );

    t.true ( DotLocker.lockedSync ( TARGET_PATH ) );

    DotLocker.unlockSync ( TARGET_PATH );

    t.false ( DotLocker.lockedSync ( TARGET_PATH ) );

  });

});
