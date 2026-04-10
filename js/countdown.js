/**
 * countdown.js
 * Inyecta un overlay oscuro con cuenta regresiva de 3 segundos
 * y un aviso simple de controles tanto para PC como celular.
 */

export function startCountdown(container, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    
    const numberNode = document.createElement('div');
    numberNode.className = 'countdown-number';
    numberNode.innerText = '3';
    
    const textNode = document.createElement('div');
    textNode.className = 'countdown-text';
    textNode.innerText = 'PC: WASD + Shift  |  Mobile: Touch & Drag';
    
    overlay.appendChild(numberNode);
    overlay.appendChild(textNode);
    container.appendChild(overlay);

    let count = 3;
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            numberNode.innerText = count;
        } else if (count === 0) {
            numberNode.innerText = 'GO!';
        } else {
            clearInterval(interval);
            container.removeChild(overlay);
            onComplete();
        }
    }, 1000);
}
