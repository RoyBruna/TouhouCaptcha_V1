/**
 * main.js
 * El punto de entrada. Acá conectamos los cables del HTML con el motor del juego.
 * Maneja los botones, los estados de UI (ganar/perder).
 */

import { Game } from './engine.js';
import { initParticles, animateParticles } from './particles.js';
import { startCountdown } from './countdown.js';

const preloadBoss = new Image();
preloadBoss.src = 'assets/images/mokou.png';

['fujiwara_mokou_theme.mp3', 'se_spellcard.mp3', 'touhou-death.mp3'].forEach(f => {
    const au = new Audio(`assets/audio/${f}`);
    au.preload = 'auto';
});

initParticles();
animateParticles();

const btnLogin = document.getElementById('login-btn');
const captchaContainer = document.getElementById('captcha-container');
const formInputs = document.getElementById('form-inputs');
const authTabs = document.querySelector('.auth-tabs');
const canvas = document.getElementById('game-canvas');
const divSuccess = document.getElementById('captcha-success');
const divFail = document.getElementById('captcha-fail');
const btnRetry = document.getElementById('retry-captcha-btn');
const btnCancel = document.getElementById('cancel-captcha-btn');
const fakeLoading = document.getElementById('fake-loading');
const preVerifyPanel = document.getElementById('captcha-pre-verify');
const btnStartCaptcha = document.getElementById('start-captcha-btn');
const btnMute = document.getElementById('mute-btn');
const toastContainer = document.getElementById('toast-container');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const groupUsername = document.getElementById('group-username');
const groupConfirm = document.getElementById('group-confirm');
const inputUsername = document.getElementById('username');
const inputConfirm = document.getElementById('password-confirm');
const authSubtitle = document.getElementById('auth-subtitle');
const authForm = document.getElementById('auth-form');

let isLoginMode = true;
let game = null;
let hasSeenCountdown = false;
let isMuted = false;

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- TRANSICIONES DE LAS TABS DE LOGIN Y REGISTER ---
function setAuthMode(mode) {
    if (isLoginMode === (mode === 'login')) return;

    isLoginMode = (mode === 'login');

    authForm.classList.add('glitch-transition');
    document.querySelector('.login-header').classList.add('glitch-transition');

    setTimeout(() => {
        if (isLoginMode) {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            groupUsername.style.display = 'none';
            groupConfirm.style.display = 'none';
            inputUsername.required = false;
            inputConfirm.required = false;
            authSubtitle.innerText = 'Secure Access System';
            btnLogin.innerText = 'LOGIN';
        } else {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            groupUsername.style.display = 'block';
            groupConfirm.style.display = 'block';
            inputUsername.required = true;
            inputConfirm.required = true;
            authSubtitle.innerText = 'New User Registration';
            btnLogin.innerText = 'REGISTER';
        }
    }, 200);

    setTimeout(() => {
        authForm.classList.remove('glitch-transition');
        document.querySelector('.login-header').classList.remove('glitch-transition');
    }, 400);
}

function showFormUI() {
    formInputs.style.display = 'block';
    authTabs.style.display = 'flex';
    captchaContainer.style.display = 'none';
    fakeLoading.style.display = 'none';
    preVerifyPanel.style.display = 'none';
    btnLogin.style.display = 'block';
    if (game) game.stop();
}

// --- autenticación (Loading trucho) ---
// Apagamos los inputs rápido para que se piensen que estamos mandando las credenciales al backend jeje,
// pero de la mismisima nada le saltamos con el botón Verify.
function triggerFakeLoad() {
    formInputs.style.display = 'none';
    authTabs.style.display = 'none';
    btnLogin.style.display = 'none';
    fakeLoading.style.display = 'flex';

    if (game) game.stop();
    game = new Game(canvas, onWin, onFail);
    game.setMute(isMuted);

    setTimeout(() => {
        fakeLoading.style.display = 'none';
        captchaContainer.style.display = 'none';
        preVerifyPanel.style.display = 'flex';
        canvas.style.display = 'none';
        divSuccess.style.display = 'none';
        divFail.style.display = 'none';
    }, 2000);
}

function startCaptcha() {
    if (game) game.unlockAudio();

    preVerifyPanel.style.display = 'none';
    captchaContainer.style.display = 'flex';
    canvas.style.display = 'block';
    divSuccess.style.display = 'none';
    divFail.style.display = 'none';

    if (!hasSeenCountdown) {
        startCountdown(captchaContainer, () => {
            hasSeenCountdown = true;
            if (game) game.start();
        });
    } else {
        if (game) game.start();
    }
}

function onWin() {
    canvas.style.display = 'none';
    divSuccess.style.display = 'block';

    setTimeout(() => {
        const action = isLoginMode ? 'Logged In' : 'Registered';
        showToast(`Access Granted. User successfully ${action}. Welcome to DEX.TROY.`, 'success');
        showFormUI();
        authForm.reset();
    }, 1500);
}

function onFail() {
    canvas.style.display = 'none';
    divFail.style.display = 'block';
    
    // Screen shake effect
    captchaContainer.classList.add('shake');
    setTimeout(() => {
        captchaContainer.classList.remove('shake');
    }, 500);
}

// --- MUTE BUTTON ---
btnMute.addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('icon-sound-on').style.display = isMuted ? 'none' : 'block';
    document.getElementById('icon-sound-off').style.display = isMuted ? 'block' : 'none';
    btnMute.classList.toggle('muted', isMuted);
    if (game) game.setMute(isMuted);
});

tabLogin.addEventListener('click', () => { if (formInputs.style.display !== 'none') setAuthMode('login'); });
tabRegister.addEventListener('click', () => { if (formInputs.style.display !== 'none') setAuthMode('register'); });

btnStartCaptcha.addEventListener('click', startCaptcha);
btnRetry.addEventListener('click', triggerFakeLoad);
btnCancel.addEventListener('click', showFormUI);

authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Chequeo cruzado de la clave por que no podíamos faltarle el respeto al login clásico.
    if (!isLoginMode) {
        const pass1 = document.getElementById('password').value;
        const pass2 = document.getElementById('password-confirm').value;

        if (pass1 !== pass2) {
            showToast('Las contraseñas no coinciden.', 'error');
            return;
        }
    }

    triggerFakeLoad();
});
