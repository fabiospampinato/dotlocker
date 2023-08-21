# DotLocker

A filesystem exclusionary lock implementation based on `.lock` files.

## Features

- It automatically resolves symlinks, ensuring different paths pointing to the same file use the same lock.
- It aquires a lock by creating a folder at the given path, with `.lock` appended to it.
- Creating a folder is an atomic operation even in network-attached file-systems.
- It keeps the lock fresh by periodically updating the folder's `ctime` timestamp.
- It automatically detects and deletes stale locks, after a configurable amount of time.
- It automatically cleans up after itself when the process exists.
- It supports a configurable amount of retries, with a configurable delay between each, for each operation.
- It also provides a synchronous implementation, that works the same and blocks the thread efficiently with `Atomics.wait`.

## Install

```sh
npm install --save dotlocker
```

## Usage

This library can be used asynchronously like this:

```ts
import DotLocker from 'dotlocker';

// Acquire a lock for a target path

const dispose = await DotLocker.lock ( '/path/to/file', {
  lockPath: '/path/to/file.my-lock', // Optional option for setting the path of the lock file manually, required if the target file doesn't exist
  retries: 10, // Optional option for configuring the number of retries to acquire a lock, 1 by default
  retryInterval: 5, // Optional option for configuring the delay between attempts, 10 by default
  staleInterval: 1_000, // Optional option for configuring the amount of milliseconds after which an existing lock is considered stale and deleted automatically, 10_000 by default
  updateInterval: 100 // Optional option for configuring how often the acquired lock should be updated to keep it fresh, 10% of "staleInterval" by default
});

const acquired = !!dispose; // Only if you received a dispose function then the lock was acquired successfully

// Check if a non-stale lock exists for a target path
// This function can return "undefined" if it failed to determine the state of the lock one way or the other

const locked = await DotLocker.locked ( '/path/to/file', {
  lockPath: '/path/to/file.my-lock',
  retries: 10,
  retryInterval: 5,
  staleInterval: 1_000
});

// Delete an acquired lock
// Using the "dispose" function received when acquiring it is safer, as that checks if a new lock got acquired at the same path also
// This function will return "true" if the lock did not exist or if it got deleted, and "false" otherwise

const unlocked = await DotLocker.unlock ( '/path/to/file', {
  lockPath: '/path/to/file.my-lock',
  retries: 10,
  retryInterval: 5
});
```

Or synchronously, with the same exact methods and options, but internally blocking the thread efficiently with `Atomics.wait` if needed, like this:

```ts
import DotLocker from 'dotlocker';

// Acquire a lock for a target path

const dispose = DotLocker.lockSync ( '/path/to/file' );
const acquired = !!dispose;

// Check if a non-stale lock exists for the target path

const locked = DotLocker.lockedSync ( '/path/to/file' );

// Delete an acquired lock

const unlocked = DotLocker.unlockSync ( '/path/to/file' );
```

## License

MIT © Fabio Spampinato
