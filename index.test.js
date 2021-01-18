import * as timersPromises from 'timers/promises'
import { withCancel, signal } from './index.js'
import { strictEqual } from 'assert';

describe('async abort signal', () => {
    it('exposes a signal inside functions', () => {
        const ac = new AbortController();
        withCancel(() => {
            strictEqual(signal().constructor.name, 'AbortSignal');
        }, { signal: ac.signal });
    });
    it('does not expose a signal inside outside withCancel', () => {
        const ac = new AbortController();
        (() => {
            strictEqual(signal().constructor.name, 'DummyAbortSignal');
        })();
    });
    it('exposes the right signal inside functions', () => {
        const ac = new AbortController();
        withCancel(() => {
            strictEqual(signal().constructor.name, 'AbortSignal');
            strictEqual(signal().aborted, false);
            ac.abort();
            strictEqual(signal().aborted, true);
        }, { signal: ac.signal });
    });
    it('is available inside async functions', () => {
        const ac = new AbortController();
        withCancel(() => {
            setTimeout(() => {
                strictEqual(signal().constructor.name, 'AbortSignal');
            });
        }, { signal: ac.signal });
    });
    it('is available inside nested functions', () => {
        const ac = new AbortController();
        withCancel(async () => {
            await Promise.resolve();
            setTimeout(async () => {
                await Promise.resolve();
                strictEqual(signal().constructor.name, 'AbortSignal');
            });
        }, { signal: ac.signal });
    });
    it('performs cancellation', async () => {
        const ac = new AbortController();
        setTimeout(() => ac.abort(), 10);
        let count = 0;
        await withCancel(async () => {
            try {
                await timersPromises.setTimeout(60000, 0, { signal: signal() });
            } catch (e) {
                count++;
            }
        }, { signal: ac.signal });
        strictEqual(count, 1);
    });

    it('does cancellation with dynamic scope', async () => {
        const ac = new AbortController();
        ac.abort();
        let i = 0
        await withCancel(async () => {
            await outside();
            i++;
        }, ac);
        strictEqual(i, 1);
    });
    it('does cancellation with nested withCancels - outer aborts', async () => {
        const ac = new AbortController();
        const otherAc = new AbortController();
        let i = 0;
        ac.abort();
        await withCancel(async () => {
            await withCancel(async () => {
                await timersPromises.setTimeout(60000, null, { signal: signal() }).catch(() => {});
                i++;
            }, otherAc);
            i++;
        }, ac);
        strictEqual(i, 2);
    });
    it('does cancellation with nested withCancels - inner aborts', async () => {
        const ac = new AbortController();
        const otherAc = new AbortController();
        let i = 0;
        otherAc.abort();
        await withCancel(async () => {
            await withCancel(async () => {
                await timersPromises.setTimeout(60000, null, { signal: signal() }).catch(() => {});
                i++;
            }, otherAc);
            i++;
        }, ac);
        strictEqual(i, 2);
    });
    it('does cancellation with nested withCancels - outer aborts async', async () => {
        const ac = new AbortController();
        const otherAc = new AbortController();
        let i = 0;
        setTimeout(() => ac.abort(), 10);
        await withCancel(async () => {
            await withCancel(async () => {
                await timersPromises.setTimeout(60000, null, { signal: signal() }).catch(() => {});
                i++;
            }, otherAc);
            i++;
        }, ac);
        strictEqual(i, 2);
    });
    it('does cancellation with nested withCancels - inner aborts async', async () => {
        const ac = new AbortController();
        const otherAc = new AbortController();
        let i = 0;
        setTimeout(() => otherAc.abort(), 10);
        await withCancel(async () => {
            await withCancel(async () => {
                await timersPromises.setTimeout(60000, null, { signal: signal() }).catch(() => {});
                i++;
            }, otherAc);
            i++;
        }, ac);
        strictEqual(i, 2);
    });
    
});

async function outside() {
    while (!signal().aborted) {
        await timersPromises.setTimeout(100);
    }
}
