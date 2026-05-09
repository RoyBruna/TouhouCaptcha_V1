/**
/**
 * entities.js
 * Acá definimos las cosas que se mueven, explotan o te quieren matar.
 * Por ahora solo las balas, porque el player y el boss son medio únicos.
 */

export class Bullet {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.r = 4;
        this.color = '#fff';
        this.accel = 0;
    }
}
