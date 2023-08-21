
/* IMPORT */

import {describe} from 'fava';
import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import DotLocker from '../dist/index.js';

/* HELPERS */

const TARGET_PATH = 'test';
const SYMLINK_PATH = 'test-link';
const LOCK_PATH = 'test.lock';

const withElapsed = promise => {
  return new Promise ( resolve => {
    const start = Date.now ();
    promise.then ( () => {
      const end = Date.now ();
      const elapsed = end - start;
      resolve ( elapsed );
    });
  });
};

/* MAIN */

describe ( 'DotLocker', it => {

  it ( 'can work asynchronously', async t => {

    t.false ( await DotLocker.locked ( TARGET_PATH ) );

    await DotLocker.lock ( TARGET_PATH );

    t.true ( await DotLocker.locked ( TARGET_PATH ) );

    await DotLocker.unlock ( TARGET_PATH );

    t.false ( await DotLocker.locked ( TARGET_PATH ) );

  });

  it ( 'can work synchronously', t => {

    t.false ( DotLocker.lockedSync ( TARGET_PATH ) );

    DotLocker.lockSync ( TARGET_PATH );

    t.true ( DotLocker.lockedSync ( TARGET_PATH ) );

    DotLocker.unlockSync ( TARGET_PATH );

    t.false ( DotLocker.lockedSync ( TARGET_PATH ) );

  });

  it ( 'can wait for an external lock to be released', async t => {

    fs.mkdirSync ( LOCK_PATH );

    const elapsed = withElapsed ( DotLocker.lock ( TARGET_PATH, {
      retries: Infinity
    }));

    await delay ( 250 );

    fs.rmdirSync ( LOCK_PATH );

    t.true ( await elapsed >= 250 );

    await DotLocker.unlock ( TARGET_PATH );

  });

  it ( 'can wait for an external lock to expire', async t => {

    fs.mkdirSync ( LOCK_PATH );

    const elapsed = withElapsed ( DotLocker.lock ( TARGET_PATH, {
      retries: Infinity,
      staleInterval: 250
    }));

    await delay ( 250 );

    t.true ( await elapsed >= 250 );

    await DotLocker.unlock ( TARGET_PATH );

  });

  it ( 'can wait for an internal lock to be released', async t => {

    DotLocker.lockSync ( TARGET_PATH, {
      updateInterval: 25
    });

    const elapsed = withElapsed ( DotLocker.lock ( TARGET_PATH, {
      retries: Infinity,
      staleInterval: 100
    }));

    await delay ( 250 );

    DotLocker.unlockSync ( TARGET_PATH );

    t.true ( await elapsed >= 250 );

    await DotLocker.unlock ( TARGET_PATH );

  });

  it ( 'can fail on an external lock that is not released', async t => {

    fs.mkdirSync ( LOCK_PATH );

    const dispose = await DotLocker.lock ( TARGET_PATH, {
      retries: 5,
      retryInterval: 50
    });

    t.is ( dispose, undefined );

    fs.rmdirSync ( LOCK_PATH );

  });

  it ( 'can return an asynchronous disposer function', async t => {

    const dispose = await DotLocker.lock ( TARGET_PATH, {
      retries: Infinity
    });

    t.true ( await DotLocker.locked ( TARGET_PATH ) );

    const result = await dispose ();

    t.is ( result, true );

    t.false ( await DotLocker.locked ( TARGET_PATH ) );

  });

  it ( 'can return a synchronous disposer function', t => {

    const dispose = DotLocker.lockSync ( TARGET_PATH, {
      retries: Infinity
    });

    t.true ( DotLocker.lockedSync ( TARGET_PATH ) );

    const result = dispose ();

    t.is ( result, true );

    t.false ( DotLocker.lockedSync ( TARGET_PATH ) );

  });

  it ( 'can detect missing locks', async t => {

    t.false ( await DotLocker.locked ( TARGET_PATH ) );

  });

  it ( 'can detect existing locks', async t => {

    fs.mkdirSync ( LOCK_PATH );

    t.true ( await DotLocker.locked ( TARGET_PATH ) );

    fs.rmdirSync ( LOCK_PATH );

  });

  it ( 'can detect stale locks', async t => {

    fs.mkdirSync ( LOCK_PATH );

    t.true ( await DotLocker.locked ( TARGET_PATH, { staleInterval: 200 } ) );

    await delay ( 250 );

    t.false ( await DotLocker.locked ( TARGET_PATH, { staleInterval: 200 } ) );

    fs.rmdirSync ( LOCK_PATH );

  });

  it ( 'throws for non-existent files with no manual lock path', t => {

    t.throws ( () => {

      DotLocker.lockSync ( 'non-existent', {
        retries: Infinity
      });

    });

  });

  it ( 'throws for non-existent parent folders with no manual lock path', t => {

    t.throws ( () => {

      DotLocker.lockSync ( 'foo/non-existent', {
        retries: Infinity
      });

    });

  });

  it ( 'does not throw for non-existent files with a manual lock path', t => {

    const options = { lockPath: 'non-existent.lock' };

    t.false ( DotLocker.lockedSync ( 'non-existent', options ) );

    const dispose = DotLocker.lockSync ( 'non-existent', options );

    t.true ( DotLocker.lockedSync ( 'non-existent', options ) );

    dispose ();

    t.false ( DotLocker.lockedSync ( 'non-existent', options ) );

  });

  it ( 'resolves symlinks automatically', t => {

    fs.symlinkSync ( TARGET_PATH, SYMLINK_PATH );

    t.false ( DotLocker.lockedSync ( SYMLINK_PATH ) );

    DotLocker.lockSync ( SYMLINK_PATH );

    t.true ( DotLocker.lockedSync ( SYMLINK_PATH ) );
    t.true ( fs.existsSync ( LOCK_PATH ) );

    DotLocker.unlockSync ( SYMLINK_PATH );

    t.false ( DotLocker.lockedSync ( SYMLINK_PATH ) );
    t.false ( fs.existsSync ( LOCK_PATH ) );

    fs.unlinkSync ( SYMLINK_PATH );

  });

});
