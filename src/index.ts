
/* IMPORT */

import fs from 'node:fs';
import whenExit from 'when-exit';
import {DEFAULT_RETRIES, DEFAULT_RETRY_INTERVAL, DEFAULT_STALE_INTERVAL, DEFAULT_UPDATE_FREQUENCY} from './constants';
import {fsAsync, fsSync} from './fs';
import {isNodeError, loop, noop, onInterval} from './utils';
import type {Dispose, Resolve, Lock, LockOptions, LockedOptions, UnlockOptions} from './types';

/* HELPERS */

const LOCKS: Record<string, Lock> = {};

const getLockPath = ( targetPath: string, lockPath?: string ): string => {

  return lockPath || `${fs.realpathSync ( targetPath )}.lock`;

};

/* MAIN - ABSTRACT */

const lockAbstract = ( fs: typeof fsAsync | typeof fsSync, resolve: Resolve<Dispose | undefined>, targetPath: string, options: LockOptions = {} ): void => {

  const lockPath = getLockPath ( targetPath, options.lockPath );
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryInterval = options.retryInterval ?? DEFAULT_RETRY_INTERVAL;
  const staleInterval = options.staleInterval ?? DEFAULT_STALE_INTERVAL;
  const updateInterval = options.updateInterval ?? Math.round ( staleInterval * DEFAULT_UPDATE_FREQUENCY );

  loop ( retries, ({ next, retry, isLast }) => {

    fs.mkdir ( lockPath, error => { // Lock acquisition attempt

      if ( isNodeError ( error ) ) { // Lock acquisition failed

        if ( error.code === 'EEXIST' && staleInterval > 0 ) { // Lock already acquired, but it may be stale

          fs.stat ( lockPath, ( _, stat ) => {

            if ( stat && ( stat.mtimeMs + staleInterval ) < Date.now () ) { // Stale lock, removing it and trying again

              fs.rmdir ( lockPath, retry );

            } else if ( !isLast () ) { // Not stale, not last try, trying again later

              fs.sleep ( retryInterval, next );

            } else { // Not stale, last try, bailing out

              resolve ( undefined );

            }

          });

        } else if ( !isLast () ) { // Acquisition failed, not last try, trying again later

          fs.sleep ( retryInterval, next );

        } else { // Acquisition failed, last try, bailing out

          resolve ( undefined );

        }

      } else { // Lock acquisition succeeded

        const lock = {
          lockPath,
          stop: noop,
          unlock: noop
        };

        queueMicrotask ( () => { // Keeping the lock alive, but in the next microtask, which is actually faster for synchronous code

          if ( LOCKS[lockPath] !== lock ) return; // Not our lock anymore

          lock.stop = onInterval ( () => fs.touch ( lockPath, noop ), updateInterval );

        });

        lock.unlock = (): void => {

          if ( LOCKS[lockPath] !== lock ) return; // Not our lock anymore

          delete LOCKS[lockPath];

          lock.stop ();

          unlockAbstract ( fs, noop, targetPath, { ...options, lockPath } );

        };

        resolve ( lock.unlock );

      }

    });

  });

};

const lockedAbstract = ( fs: typeof fsAsync | typeof fsSync, resolve: Resolve<boolean | undefined>, targetPath: string, options: LockedOptions = {} ): void => {

  const lockPath = getLockPath ( targetPath, options.lockPath );
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryInterval = options.retryInterval ?? DEFAULT_RETRY_INTERVAL;
  const staleInterval = options.staleInterval ?? DEFAULT_STALE_INTERVAL;

  loop ( retries, ({ next, isLast }) => {

    fs.stat ( lockPath, ( error, stat ) => { // Lock existence check attempt

      if ( isNodeError ( error ) && error.code === 'ENOENT' ) { // Lock does not exist

        resolve ( false );

      } else if ( stat ) { // Lock exists

        const locked = ( stat.mtimeMs + staleInterval ) >= Date.now (); // Is it stale or not?

        resolve ( locked );

      } else if ( !isLast () ) { // Check failed, not last try, trying again later

        fs.sleep ( retryInterval, next );

      } else { // Check failed, last try, bailing out

        resolve ( undefined );

      }

    });

  });

};

const unlockAbstract = ( fs: typeof fsAsync | typeof fsSync, resolve: Resolve<boolean>, targetPath: string, options: UnlockOptions = {} ): void => {

  const lockPath = getLockPath ( targetPath, options.lockPath );
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryInterval = options.retryInterval ?? DEFAULT_RETRY_INTERVAL;

  loop ( retries, ({ next, isLast }) => {

    fs.rmdir ( lockPath, error => { // Lock removal attempt

      if ( !error || ( isNodeError ( error ) && error.code === 'ENOENT' ) ) { // Lock removal succeeded

        resolve ( true );

      } else if ( !isLast () ) { // Removal failed, not last try, trying again later

        fs.sleep ( retryInterval, next );

      } else { // Removal failed, last try, bailing out

        resolve ( false );

      }

    });

  });

};

/* MAIN - ASYNC */

const lockAsync = ( targetPath: string, options: LockOptions = {} ): Promise<Dispose | undefined> => {

  return new Promise ( resolve => {

    lockAbstract ( fsAsync, resolve, targetPath, options );

  });

};

const lockedAsync = ( targetPath: string, options: LockedOptions = {} ): Promise<boolean | undefined> => {

  return new Promise ( resolve => {

    lockedAbstract ( fsAsync, resolve, targetPath, options );

  });

};

const unlockAsync = ( targetPath: string, options: UnlockOptions = {} ): Promise<boolean> => {

  return new Promise ( resolve => {

    unlockAbstract ( fsAsync, resolve, targetPath, options );

  });

};

/* MAIN - SYNC */

const lockSync = ( targetPath: string, options: LockOptions = {} ): Dispose | undefined => {

  let result: Dispose | undefined;

  lockAbstract ( fsSync, value => result = value, targetPath, options );

  return result;

};

const lockedSync = ( targetPath: string, options: LockedOptions = {} ): boolean | undefined => {

  let result: boolean | undefined;

  lockedAbstract ( fsSync, value => result = value, targetPath, options );

  return result;

};

const unlockSync = ( targetPath: string, options: UnlockOptions = {} ): boolean => {

  let result = false;

  unlockAbstract ( fsSync, value => result = value, targetPath, options );

  return result;

};

const unlockAllSync = (): void => {

  for ( const lockPath in LOCKS ) {

    const lock = LOCKS[lockPath];

    lock.stop ();

    unlockSync ( lockPath, {
      lockPath,
      retries: 20,
      retryInterval: 3
    });

  }

};

/* MAIN */

const DotLocker = {
  /* ASYNC */
  lock: lockAsync,
  locked: lockedAsync,
  unlock: unlockAsync,
  /* SYNC */
  lockSync,
  lockedSync,
  unlockSync
};

/* INIT */

whenExit ( unlockAllSync );

/* EXPORT */

export default DotLocker;
