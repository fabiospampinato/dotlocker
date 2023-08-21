
/* IMPORT */

import type {Dispose} from './types';

/* MAIN */

const castError = ( error: unknown ): Error => {

  if ( error instanceof Error ) return error;

  if ( typeof error === 'string' ) return new Error ( error );

  return new Error ( 'Unknown error' );

};

const isError = ( value: unknown ): value is Error => {

  return value instanceof Error;

};

const isNodeError = ( value: unknown ): value is NodeJS.ErrnoException => {

  return isError ( value ) && ( 'code' in value );

};

const loop = ( times: number, fn: ( data: ({ next: () => void, retry: () => void, isLast: () => boolean }) ) => void ): void => {

  const next = (): void => {

    if ( times > 0 ) {

      times -= 1;

      fn ({ next, retry, isLast });

    }

  };

  const retry = (): void => {

    fn ({ next, retry, isLast });

  };

  const isLast = (): boolean => {

    return times <= 0;

  };

  fn ({ next, retry, isLast });

};

const noop = (): void => {

  return;

};

const onInterval = ( fn: Function, timeout: number ): Dispose => {

  const timer = setInterval ( fn, timeout );

  timer['unref']?.();

  return () => clearInterval ( timer );

};

const onTimeout = ( fn: Function, timeout: number ): Dispose => {

  const timer = setTimeout ( fn, timeout );

  timer['unref']?.();

  return () => clearTimeout ( timer );

};

/* EXPORT */

export {castError, isError, isNodeError, loop, noop, onInterval, onTimeout};
