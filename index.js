import { AsyncLocalStorage } from 'async_hooks'
// const ac = new AbortController();

const als = new AsyncLocalStorage();

export function withCancel(fn, { signal }) {
    if (!signal) {
        throw new TypeError("Missing signal argument");
    }
    const store = {
        name: 'AbortSignalStore',
        signal,
    };
    const current = als.getStore();
    if (current?.name === 'AbortSignalStore') {
        // we are already inside a withCancel, so chain them
        const newAc = new AbortController();
        if (current.signal.aborted || signal.aborted) {
            newAc.abort();
        }
        signal.addEventListener('abort', () => newAc.abort(), { signal: newAc.signal});
        current.signal.addEventListener('abort', () => newAc.abort(), { signal: newAc.signal});
        store.signal = newAc.signal;
    }
    return als.run(store, fn);
}
export function signal() {
    const store = als.getStore();
    if (store?.name !== 'AbortSignalStore') {
        const signal = new class DummyAbortSignal extends EventTarget { get aborted() { return false; } };
        return signal;
    }
    return store.signal;
}