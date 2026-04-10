const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let particles = [];

export function initParticles() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    particles = [];
    const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000);

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            r: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5 - 0.2,
            color: `rgba(${150 + Math.random() * 105}, ${20 + Math.random() * 30}, 0, ${Math.random() * 0.5 + 0.1})`,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.02
        });
    }
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
        p.angle += p.spin;
        p.x += p.vx + Math.sin(p.angle) * 0.5;
        p.y += p.vy;

        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;

        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bgCtx.fillStyle = p.color;
        bgCtx.fill();
    }
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', initParticles);
