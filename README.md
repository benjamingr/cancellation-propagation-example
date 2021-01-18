### Cancellation propagation attempt

This code does automatic signal propagation using `AsyncLocalStorage`, it's pretty short and its purpose is to see if this API is useful, useless or just foot-gunny.

For example this lets you do:

```js
import { withCancel, signal } from './index.js';

const ac = new AbortController();
setTimeout(() => ac.abort(), 10);
let count = 0;
await withCancel(async () => { // wrap with an IIFE if you don't have TLA enabled
    try {
        await timersPromises.setTimeout(60000, 0, { signal: signal() });
    } catch (e) {
        count++;
    }
}, { signal: ac.signal });
strictEqual(count, 1);
```

This means that instead of passing `signal` everywhere you can just call the `signal()` function and access the abort signal from context.

### License

MIT, or if you want I will let you use this code any other license if you ask :]

### Contributing

Please check this code out and tell me if it works for you or if you think it's a good idea.

### Code Of Conduct

This project uses the Contributor Covenant Code of Conduct. Reports go to benjamingr @ gmail
