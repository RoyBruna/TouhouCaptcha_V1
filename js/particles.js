const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let particles = [];

export function initParticles() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    particles = [];
    const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 12000);

    for (let i = 0; i < numParticles; i++) {
        const p = createParticle();
        // Start them at random life stages so they don't all fade in at once
        p.life = Math.random() * p.maxLife; 
        particles.push(p);
    }
}

function createParticle() {
    return {
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        maxR: Math.random() * 5 + 3, // radius between 3 and 8
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.2,
        color: `rgba(${150 + Math.random() * 105}, ${20 + Math.random() * 30}, 0, ${Math.random() * 0.3 + 0.1})`,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        life: 0,
        maxLife: 200 + Math.random() * 400 // Lives for ~3 to 10 seconds
    };
}

function drawHexagon(ctx, x, y, r, angle) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = angle + (i * Math.PI / 3);
        const hx = x + Math.cos(a) * r;
        const hy = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
}

function drawHUDDecals(ctx, w, h, time) {
    const primaryColor = 'rgba(209, 48, 0, 0.4)';
    const accentColor = 'rgba(209, 48, 0, 0.8)';
    const glowColor = 'rgba(209, 48, 0, 0.2)';
    const energyColor = 'rgba(255, 140, 50, 1)';

    ctx.save();
    ctx.strokeStyle = primaryColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;

    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(60, 30);
    ctx.lineTo(80, 50);
    ctx.lineTo(250, 50);
    ctx.stroke();
    
    const animStep1 = Math.floor(time / 150) % 5;
    for (let i = 0; i < 5; i++) {
        const isActive = (i === animStep1);
        ctx.fillStyle = isActive ? energyColor : accentColor;
        ctx.shadowColor = isActive ? energyColor : glowColor;
        ctx.fillRect(100 + i * 16, 46, 8, 4);
    }
    
    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.moveTo(w, 40);
    ctx.lineTo(w - 100, 40);
    ctx.lineTo(w - 120, 60);
    ctx.lineTo(w - 300, 60);
    ctx.stroke();

    const animStep2 = Math.floor(time / 200) % 4;
    for (let i = 0; i < 4; i++) {
        const isActive = ((3 - i) === animStep2);
        ctx.beginPath();
        ctx.arc(w - 150 - i * 20, 60, 3, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? energyColor : accentColor;
        ctx.shadowColor = isActive ? energyColor : glowColor;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.moveTo(20, h - 300);
    ctx.lineTo(40, h - 280);
    ctx.lineTo(40, h - 50);
    ctx.lineTo(200, h - 50);
    ctx.stroke();

    const animStep3 = Math.floor(time / 120) % 6;
    for (let i = 0; i < 6; i++) {
        const isActive = (i === animStep3);
        ctx.fillStyle = isActive ? energyColor : primaryColor;
        ctx.shadowColor = isActive ? energyColor : glowColor;
        ctx.fillRect(45, (h - 260) + i * 15, 4, 8);
    }

    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.moveTo(w - 20, h - 300);
    ctx.lineTo(w - 20, h - 100);
    ctx.lineTo(w - 50, h - 70);
    ctx.lineTo(w - 250, h - 70);
    ctx.stroke();

    const isPulsing = Math.sin(time / 300) > 0;
    ctx.beginPath();
    ctx.moveTo(w - 10, h - 10);
    ctx.lineTo(w - 40, h - 10);
    ctx.lineTo(w - 50, h - 20);
    ctx.lineTo(w - 100, h - 20);
    ctx.strokeStyle = isPulsing ? energyColor : primaryColor;
    ctx.shadowColor = isPulsing ? energyColor : glowColor;
    ctx.stroke();

    ctx.restore();
}

export function animateParticles(time) {
    if (!time) time = performance.now();
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    drawHUDDecals(bgCtx, bgCanvas.width, bgCanvas.height, time);

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        // Respawn if dead
        if (p.life >= p.maxLife) {
            particles[i] = createParticle();
            continue;
        }

        p.angle += p.spin;
        p.x += p.vx + Math.sin(p.angle) * 0.5;
        p.y += p.vy;

        // Wrap around (just in case they drift too far off screen before dying)
        if (p.x < -20) p.x = bgCanvas.width + 20;
        if (p.x > bgCanvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = bgCanvas.height + 20;
        if (p.y > bgCanvas.height + 20) p.y = -20;

        // Smooth grow and shrink using sine wave (0 to 1 to 0 based on life progress)
        const progress = p.life / p.maxLife;
        const currentR = p.maxR * Math.sin(progress * Math.PI);

        // Draw particle
        drawHexagon(bgCtx, p.x, p.y, currentR, p.angle);
        bgCtx.fillStyle = p.color;
        bgCtx.fill();
        bgCtx.strokeStyle = p.color;
        bgCtx.lineWidth = 1;
        bgCtx.stroke();
    }
    
    // Ocasional Glitch Effect (Screen Tearing)
    // 0.3% chance per frame (approx once every 5-6 seconds)
    if (Math.random() < 0.003) {
        const y = Math.random() * bgCanvas.height;
        const h = Math.random() * 80 + 20;
        const shiftX = (Math.random() - 0.5) * 40;
        
        // Slice the canvas and shift it horizontally to simulate tearing
        bgCtx.drawImage(bgCanvas, 0, y, bgCanvas.width, h, shiftX, y, bgCanvas.width, h);
        
        // Add a subtle color distortion
        bgCtx.fillStyle = `rgba(209, 48, 0, ${Math.random() * 0.15})`;
        bgCtx.fillRect(0, y, bgCanvas.width, h);
    }

    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', initParticles);
