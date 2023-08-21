
/* IMPORT */

import fs from 'node:fs';
import {castError, onTimeout} from './utils';
import type {CallbackWithValue, CallbackWithoutValue} from './types';

/* MAIN - ASYNC */

const mkdirAsync = ( path: string, cb: CallbackWithoutValue ): void => {

  fs.mkdir ( path, {}, cb );

};

const rmdirAsync = ( path: string, cb: CallbackWithoutValue ): void => {

  fs.rmdir ( path, cb );

};

const sleepAsync = ( ms: number, cb: CallbackWithoutValue ): void => {

  onTimeout ( cb, ms );

};

const statAsync = ( path: string, cb: CallbackWithValue<fs.Stats> ): void => {

  fs.stat ( path, cb );

};

const touchAsync = ( path: string, cb: CallbackWithoutValue ): void => {

  const now = Date.now ();

  fs.utimes ( path, now, now, cb );

};

/* MAIN - SYNC */

const mkdirSync = ( path: string, cb: CallbackWithoutValue ): void => {

  try {

    fs.mkdirSync ( path );

    cb ( null );

  } catch ( error: unknown ) {

    cb ( castError ( error ) );

  }

};

const rmdirSync = ( path: string, cb: CallbackWithoutValue ): void => {

  try {

    fs.rmdirSync ( path );

    cb ( null );

  } catch ( error: unknown ) {

    cb ( castError ( error ) );

  }

};

const sleepSync = ( ms: number, cb: CallbackWithoutValue ): void => {

  Atomics.wait ( new Int32Array ( new SharedArrayBuffer ( 4 ) ), 0, 0, ms );

  cb ( null );

};

const statSync = ( path: string, cb: CallbackWithValue<fs.Stats> ): void => {

  try {

    const stat = fs.statSync ( path );

    cb ( null, stat );

  } catch ( error: unknown ) {

    cb ( castError ( error ) );

  }

};

const touchSync = ( path: string, cb: CallbackWithoutValue ): void => {

  try {

    const now = Date.now ();

    fs.utimesSync ( path, now, now );

    cb ( null );

  } catch ( error: unknown ) {

    cb ( castError ( error ) );

  }

};

/* MAIN */

const fsAsync = {
  mkdir: mkdirAsync,
  rmdir: rmdirAsync,
  sleep: sleepAsync,
  stat: statAsync,
  touch: touchAsync
};

const fsSync = {
  mkdir: mkdirSync,
  rmdir: rmdirSync,
  sleep: sleepSync,
  stat: statSync,
  touch: touchSync
};

/* EXPORT */

export {mkdirAsync, rmdirAsync, sleepAsync, statAsync, touchAsync};
export {mkdirSync, rmdirSync, sleepSync, statSync, touchSync};
export {fsAsync, fsSync};
