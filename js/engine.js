/**
 * engine.js
 * Core of this shit. Lógica, loop de FPS, matemática y colisiones.
 */

import { CONFIG } from './config.js';
import { Pool } from './pool.js';
import { Bullet } from './entities.js';

export class Game {
    constructor(canvas, onWin, onFail) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.onWin = onWin;
        this.onFail = onFail;

        this.width = CONFIG.CANVAS_WIDTH;
        this.height = CONFIG.CANVAS_HEIGHT;

        this.keys = {};
        this.timeLeft = CONFIG.SURVIVAL_TIME;
        this.isRunning = false;
        this.frameCount = 0;

        this.player = { x: this.width / 2, y: this.height - 80, hitbox: CONFIG.PLAYER_SIZE };
        this.boss = { x: this.width / 2, y: 80, hp: 100, angle: 0 };

        this.bullets = [];
        this.bulletPool = new Pool(
            () => new Bullet(),
            (b) => {
                b.active = true;
                b.accel = 0;
            },
            CONFIG.BULLET_Pool_SIZE
        );

        this.bgm = new Audio('assets/audio/fujiwara_mokou_theme.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.5;

        this.spellSound = new Audio('assets/audio/se_spellcard.mp3');
        this.spellSound.volume = 0.8;

        this.deathSound = new Audio('assets/audio/touhou-death.mp3');
        this.deathSound.volume = 0.8;

        this.bossSprite = new Image();
        this.bossSprite.src = 'assets/images/mokou.png';

        this.bulletCache = {};

        this.initInput();
    }

    // --- CACHÉ DE SPRITES (La magia para no hacer bosta la GPU) ---
    // El glow (ShadowBlur) chupa demasiada memoria si lo renderizamos a lo bruto cada frame.
    // Acá pre-renderizamos la bala con glow en un canvas mini invisible y lo cacheamos.
    getBulletSprite(color, radius) {
        const key = `${color}_${radius}`;
        if (this.bulletCache[key]) {
            return this.bulletCache[key];
        }

        const glowSize = 10;
        const size = (radius + glowSize) * 2;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const oCtx = offCanvas.getContext('2d');

        const center = size / 2;

        oCtx.shadowColor = color;
        oCtx.shadowBlur = glowSize;
        oCtx.fillStyle = '#fff';

        oCtx.beginPath();
        oCtx.arc(center, center, radius, 0, Math.PI * 2);
        oCtx.fill();

        this.bulletCache[key] = {
            canvas: offCanvas,
            offset: center
        };

        return this.bulletCache[key];
    }

    playSpellSound() {
        this.spellSound.currentTime = 0;
        this.spellSound.play().catch(e => console.log("No se encontró se_spellcard.mp3"));
    }

    playDeathSound() {
        this.deathSound.currentTime = 0;
        this.deathSound.play().catch(e => console.log("No se encontró touhou-death.mp3"));
    }

    initInput() {
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        this.touchActive = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            const touch = e.touches[0];
            this.lastTouchX = touch.clientX;
            this.lastTouchY = touch.clientY;
            this.touchActive = true;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isRunning || !this.touchActive) return;
            e.preventDefault();
            const touch = e.touches[0];
            
            const dx = touch.clientX - this.lastTouchX;
            const dy = touch.clientY - this.lastTouchY;
            
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.player.x += (dx * scaleX) * 1.5;
            this.player.y += (dy * scaleY) * 1.5;

            this.lastTouchX = touch.clientX;
            this.lastTouchY = touch.clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            this.touchActive = false;
        });
    }

    start() {
        this.isRunning = true;
        this.timeLeft = CONFIG.SURVIVAL_TIME;
        this.frameCount = 0;
        this.spellCardActive = false;
        this.phase2Active = false;
        const grid = document.querySelector('.grid-overlay');
        if(grid) {
            grid.classList.remove('spellcard');
            grid.classList.remove('phase2');
        }
        
        this.bullets = [];
        this.player.x = this.width / 2;
        this.player.y = this.height - 80;
        this.lastTime = performance.now();

        this.bgm.currentTime = 0;
        this.bgm.play().catch(e => console.log("El navegador bloqueó el audio, dale click a algo:", e));

        requestAnimationFrame((t) => this.loop(t));
    }

    unlockAudio() {
        this.spellSound.play().then(() => this.spellSound.pause()).catch(e => { });
        this.deathSound.play().then(() => this.deathSound.pause()).catch(e => { });
    }

    setMute(isMuted) {
        this.isMuted = isMuted;
        this.bgm.muted = isMuted;
        this.spellSound.muted = isMuted;
        this.deathSound.muted = isMuted;
    }

    stop() {
        this.isRunning = false;
        this.bgm.pause();
        this.bgm.currentTime = 0;
    }

    spawnBullet(x, y, vx, vy, color, r = 4, accel = 0) {
        const b = this.bulletPool.get();
        b.x = x;
        b.y = y;
        b.vx = vx;
        b.vy = vy;
        b.color = color;
        b.r = r;
        b.accel = accel;
        this.bullets.push(b);
    }

    // --- LOGICA (Acá pasa de todo) ---
    // Chequeamos tiempos, fases de ataque de Mokou y si el jugador paro una bala con la cabeza.
    update(dt) {
        this.timeLeft -= dt;

        if (this.timeLeft <= 0) {
            this.stop();
            this.onWin();
            return;
        }

        this.frameCount++;

        let speed = this.keys['shift'] ? CONFIG.FOCUS_SPEED : CONFIG.PLAYER_SPEED;
        if (this.keys['a']) this.player.x -= speed;
        if (this.keys['d']) this.player.x += speed;
        if (this.keys['w']) this.player.y -= speed;
        if (this.keys['s']) this.player.y += speed;

        this.player.x = Math.max(10, Math.min(this.width - 10, this.player.x));
        this.player.y = Math.max(10, Math.min(this.height - 10, this.player.y));

        this.boss.x = this.width / 2 + Math.sin(this.frameCount * 0.01) * 30;

        const timePassed = CONFIG.SURVIVAL_TIME - this.timeLeft;

        if (timePassed >= 15 && !this.spellCardActive) {
            this.spellCardActive = true;
            this.playSpellSound();
            this.boss.y = 120;
            
            const grid = document.querySelector('.grid-overlay');
            if(grid) {
                grid.classList.remove('phase2');
                grid.classList.add('spellcard');
            }
        }

        // FASE 1 (0-10s): Cola de fénix. 
        // Spammea balas rojas piolas en el fondo para calentar los dedos si no conoces el juego.
        if (timePassed < 10) {
            if (this.frameCount % 4 === 0) {
                for (let i = -2; i <= 2; i++) {
                    const angle = Math.PI / 2 + (Math.sin(this.frameCount * 0.05) * 0.5) + (i * 0.1);
                    const speed = 3 + Math.abs(i) * 0.5;
                    this.spawnBullet(this.boss.x, this.boss.y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#ff4500', 3);
                }
            }
        }
        // FASE 2 (10-15s): Laberinto. El Check-Point de Humanidad.
        // Si sos un bot escaneando, esa pared de balas sin hueco visible te desarma fijo.
        else if (timePassed < 15) {
            if (!this.phase2Active) {
                this.phase2Active = true;
                const grid = document.querySelector('.grid-overlay');
                if(grid) grid.classList.add('phase2');
            }

            if (this.frameCount % 55 === 0) {
                const doorWidth = 90; 
                const doorPos = Math.random() * (this.width - doorWidth - 40) + 20;
                
                const numBullets = 22;
                for (let i = 0; i <= numBullets; i++) {
                    const bx = (this.width / numBullets) * i;
                    
                    if (bx > doorPos && bx < doorPos + doorWidth) {
                        continue;
                    }
                    
                    this.spawnBullet(bx, this.height + 10, 0, -3, '#ff8800', 5);
                }
            }
        }
        // FASE 3 (15-29s): SPELL CARD 'Possessed by Phoenix'. [skill issue].
        // Anillos expansivos rojos que le cagan la vida al movimiento...
        else {
            if (this.frameCount % 20 === 0) {
                const numBullets = 30;
                for (let i = 0; i < numBullets; i++) {
                    const angle = (Math.PI * 2 / numBullets) * i + (this.frameCount * 0.01);
                    this.spawnBullet(this.boss.x, this.boss.y, Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, '#ff0000', 4);
                }
            }
            // ... balitas blancas: 
            // caen completamente random de fondo, o deciden apuntarle derechito a la frente al jugador.
            if (this.frameCount % 10 === 0) {
                let angle;
                if (Math.random() > 0.5) {
                    angle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x) + (Math.random() - 0.5) * 0.3;
                } else {
                    angle = Math.random() * Math.PI * 2;
                }
                this.spawnBullet(this.boss.x, this.boss.y, Math.cos(angle) * 4, Math.sin(angle) * 4, '#fff', 3);
            }
        }

        // --- FISICAS Y COLISIONES --- 
        // Calculamos euclidiana bala a bala contra el radio del jugador.
        // Si se la dan en la pera, suena el sonido de kill en touhou.
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.accel !== 0) {
                b.vx *= b.accel;
                b.vy *= b.accel;
            }
            b.x += b.vx;
            b.y += b.vy;

            if (b.x < -20 || b.x > this.width + 20 || b.y < -20 || b.y > this.height + 20) {
                this.bulletPool.release(b);
                this.bullets.splice(i, 1);
                continue;
            }

            const dx = b.x - this.player.x;
            const dy = b.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.hitbox + b.r - 1) {
                this.playDeathSound();
                this.stop();
                this.onFail();
                return;
            }
        }
    }

    draw() {

        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.spellCardActive) {
            // Pulso lento y oscuro
            const alpha = 0.5 + Math.sin(this.frameCount * 0.02) * 0.4;
            this.ctx.fillStyle = `rgba(15, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            const pulse = Math.sin(this.frameCount * 0.05) * 20;
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, 'rgba(34, 0, 0, 0.2)');
            gradient.addColorStop(1, `rgba(${30 + pulse}, 0, 0, 0.2)`);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        const spellTimeLeft = this.timeLeft;
        const spellStartTime = 14;
        const timeSinceSpell = spellStartTime - spellTimeLeft;

        if (this.spellCardActive && timeSinceSpell >= 0 && timeSinceSpell <= 2 && this.bossSprite.complete) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.2;

            const spriteW = 250;
            const spriteH = 250;
            const centerX = this.width / 2 - spriteW / 2;
            let displayY = this.height;

            if (timeSinceSpell < 0.5) {
                const progress = timeSinceSpell / 0.5;
                const targetY = this.height / 2 - spriteH / 2;
                displayY = this.height - (this.height - targetY) * (
                    1 - Math.pow(1 - progress, 3)
                );
            } else if (timeSinceSpell < 1.5) {
                displayY = this.height / 2 - spriteH / 2;
            } else {
                const progress = (timeSinceSpell - 1.5) / 0.5;
                const startY = this.height / 2 - spriteH / 2;
                const targetY = -spriteH;
                displayY = startY - Math.abs(startY - targetY) * (
                    Math.pow(progress, 3)
                );
            }

            this.ctx.drawImage(this.bossSprite, centerX, displayY, spriteW, spriteH);
            this.ctx.restore();

            if (timeSinceSpell < 2) {
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(209, 48, 0, 0.6)';
                this.ctx.fillRect(0, 80, this.width, 40);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#000';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText('SPELL CARD BONUS: Possessed by Phoenix', this.width / 2, 105);
                this.ctx.restore();
            }
        }

        this.ctx.fillStyle = this.keys['shift'] ? '#fff' : '#aaa';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, CONFIG.PLAYER_SIZE, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f00';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 2, 0, Math.PI * 2);
        this.ctx.fill();

        const auraSize = CONFIG.BOSS_SIZE * (1.2 + Math.sin(this.frameCount * 0.1) * 0.1);
        const auraGradient = this.ctx.createRadialGradient(this.boss.x, this.boss.y, CONFIG.BOSS_SIZE * 0.5, this.boss.x, this.boss.y, auraSize);
        auraGradient.addColorStop(0, 'rgba(209, 48, 0, 0.8)');
        auraGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        this.ctx.fillStyle = auraGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.boss.x, this.boss.y, auraSize, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.bossSprite.complete) {
            const size = CONFIG.BOSS_SIZE * 2.5;
            this.ctx.drawImage(this.bossSprite, this.boss.x - size / 2, this.boss.y - size / 2, size, size);
        } else {
            this.ctx.fillStyle = '#d13000';
            this.ctx.beginPath();
            this.ctx.arc(this.boss.x, this.boss.y, CONFIG.BOSS_SIZE, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.strokeStyle = `rgba(209, 48, 0, ${0.5 + Math.sin(this.frameCount * 0.1) * 0.2})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.boss.x, this.boss.y, CONFIG.BOSS_SIZE, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            const sprite = this.getBulletSprite(b.color, b.r);

            this.ctx.drawImage(
                sprite.canvas,
                b.x - sprite.offset,
                b.y - sprite.offset
            );
        }

        this.ctx.restore();

        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.shadowBlur = 0;
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`SURVIVE: ${this.timeLeft.toFixed(2)}`, 10, 20);

        if (this.spellCardActive) {
            this.ctx.fillStyle = '#d13000';
            this.ctx.fillText(`SPELL CARD`, 10, 40);
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
