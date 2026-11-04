document.addEventListener("DOMContentLoaded", () => {
    // ==================== CANVAS DE ANIMACIÓN V-COMM ====================
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        let width, height;
        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const palette = ['#D81B60', '#FF5722', '#FFC107', '#9C27B0'];
        const particles = [];
        const particleCount = 45;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.5 + 1,
                color: palette[Math.floor(Math.random() * palette.length)],
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4
            });
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            // Dibujar Red de Conexiones
            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(216, 27, 96, ${0.12 - dist / 1100})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            // Dibujar Partículas
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
            });

            // Onda de Sonido Inferior
            const time = Date.now() * 0.002;
            const waveY = height - 40;
            ctx.beginPath();
            ctx.moveTo(0, height);
            for (let x = 0; x < width; x += 10) {
                const y = waveY + Math.sin(x * 0.01 + time) * 15 + Math.cos(x * 0.02 + time) * 10;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.fillStyle = 'rgba(216, 27, 96, 0.03)';
            ctx.fill();

            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }
});

// ==================== ESTADO DE ZONAS Y SIMULADOR (MAQUETA) ====================
const zones = { 1: false, 2: false, 3: false, 4: false };
let audioCtx = null;

function toggleZone(id) {
    zones[id] = !zones[id];
    const btn = document.getElementById(`btn-zone-${id}`);
    const icon = document.getElementById(`icon-zone-${id}`);
    const spk = document.getElementById(`spk-${id}`);

    if (zones[id]) {
        if (btn) {
            btn.classList.add('border-vcomm-orange', 'bg-vcomm-orange/10');
            btn.classList.remove('bg-vcomm-dark/50');
        }
        if (icon) icon.className = 'fa-solid fa-toggle-on text-vcomm-orange text-lg';
        if (spk) {
            spk.classList.replace('bg-slate-900/50', 'bg-vcomm-magenta/20');
            spk.classList.replace('border-slate-800', 'border-vcomm-magenta');
            const spkIcon = spk.querySelector('i');
            if (spkIcon) spkIcon.className = 'fa-solid fa-volume-high text-2xl text-vcomm-orange mb-2 animate-bounce';
        }
    } else {
        if (btn) {
            btn.classList.remove('border-vcomm-orange', 'bg-vcomm-orange/10');
            btn.classList.add('bg-vcomm-dark/50');
        }
        if (icon) icon.className = 'fa-solid fa-toggle-off text-gray-500 text-lg';
        if (spk) {
            spk.classList.replace('bg-vcomm-magenta/20', 'bg-slate-900/50');
            spk.classList.replace('border-vcomm-magenta', 'border-slate-800');
            const spkIcon = spk.querySelector('i');
            if (spkIcon) spkIcon.className = 'fa-solid fa-volume-xmark text-2xl text-slate-600 mb-2';
        }
    }
    updateStatus();
}

function updateStatus() {
    const activeCount = Object.values(zones).filter(Boolean).length;
    const statusBadge = document.getElementById('system-status');
    if (!statusBadge) return;
    
    if (activeCount > 0) {
        statusBadge.textContent = `${activeCount} ZONA(S) ACTIVAS`;
        statusBadge.className = "text-xs font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30";
    } else {
        statusBadge.textContent = "STANDBY";
        statusBadge.className = "text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-gray-400 border border-slate-700";
    }
}

// ==================== MODAL DE ADVERTENCIA (MAQUETA) ====================
function openWarningModal() {
    const modal = document.getElementById('modal-warning-maqueta');
    const modalBox = document.getElementById('modal-warning-box');
    if (!modal || !modalBox) return;
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalBox.classList.remove('scale-90');
        modalBox.classList.add('scale-100');
    }, 10);
}

function closeWarningModal() {
    const modal = document.getElementById('modal-warning-maqueta');
    const modalBox = document.getElementById('modal-warning-box');
    if (!modal || !modalBox) return;
    
    modalBox.classList.remove('scale-100');
    modalBox.classList.add('scale-90');
    modal.classList.add('opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// ==================== SINTETIZADOR DE AUDIO (WEB AUDIO API) ====================
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playChime() {
    const activeZones = Object.values(zones).some(Boolean);
    if (!activeZones) {
        openWarningModal();
        return;
    }

    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // Mi5
    osc.frequency.exponentialRampToValueAtTime(523.25, audioCtx.currentTime + 0.5); // Do5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

let micOsc = null;
function startMic() {
    if (!Object.values(zones).some(Boolean)) {
        openWarningModal();
        return;
    }
    initAudio();
    micOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    micOsc.type = 'triangle';
    micOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    micOsc.connect(gain);
    gain.connect(audioCtx.destination);
    micOsc.start();
}

function stopMic() {
    if (micOsc) {
        micOsc.stop();
        micOsc = null;
    }
}

// ==================== MODAL DE CONFIRMACIÓN (CONTACTO) ====================
function handleSubmit(e) {
    e.preventDefault();

    const modal = document.getElementById('modal-confirmacion');
    const modalBox = document.getElementById('modal-box');
    if (!modal || !modalBox) return;
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalBox.classList.remove('scale-90');
        modalBox.classList.add('scale-100');
    }, 10);

    e.target.reset();
}

function closeModal() {
    const modal = document.getElementById('modal-confirmacion');
    const modalBox = document.getElementById('modal-box');
    if (!modal || !modalBox) return;
    
    modalBox.classList.remove('scale-100');
    modalBox.classList.add('scale-90');
    modal.classList.add('opacity-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}