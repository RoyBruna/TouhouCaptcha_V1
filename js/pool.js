/**
 * pool.js
 * Sistema de reciclaje de objetos.
 * Básicamente, en vez de crear y destruir cosas todo el tiempo (que a JS no le cabe una),
 * las guardamos en una cajita y las volvemos a usar. Ecología de código, inteligente, no? lo vi en YT :P.
 */

export class Pool {
    constructor(createFn, resetFn, initialSize) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        if (this.pool.length > 0) {
            const item = this.pool.pop();
            this.resetFn(item);
            return item;
        }
        return this.createFn();
    }

    release(item) {
        this.pool.push(item);
    }
}
