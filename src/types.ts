
/* MAIN */

type CallbackWithValue<T> = {
  ( error: Error | null, value?: T ): void
};

type CallbackWithoutValue = {
  ( error: Error | null ): void
};

type Dispose = {
  (): void
};

type Resolve<T> = {
  ( value: T ): void
};

type Lock = {
  lockPath: string,
  stop: () => void
  unlock: () => void
};

type LockOptions = {
  lockPath?: string,
  retries?: number,
  retryInterval?: number,
  staleInterval?: number,
  updateInterval?: number
};

type LockedOptions = {
  lockPath?: string,
  retries?: number,
  retryInterval?: number,
  staleInterval?: number
};

type UnlockOptions = {
  lockPath?: string,
  retries?: number,
  retryInterval?: number
};

/* EXPORT */

export type {CallbackWithValue, CallbackWithoutValue, Dispose, Lock, Resolve, LockOptions, LockedOptions, UnlockOptions};
