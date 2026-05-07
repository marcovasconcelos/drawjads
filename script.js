// CONFIGURAÇÃO DA CONEXÃO
const ably = new Ably.Realtime('c5kN_g.ANl6kQ:ttepvulm37Z1xO4d4pCQpazfL-zPIhJrBHeA3pdtDTA');
const channel = ably.channels.get('drawjads-room');

const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const lineWidth = document.getElementById('lineWidth');
const clearBtn = document.getElementById('clear');
const eraserBtn = document.getElementById('eraserBtn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let isEraser = false;

// Alternar entre Borracha e Lápis
eraserBtn.addEventListener('click', () => {
    isEraser = !isEraser;
    eraserBtn.style.background = isEraser ? '#ff0000' : '#f0f0f0';
    eraserBtn.innerText = isEraser ? 'Usando Borracha' : 'Borracha';
});

function startDrawing(e) {
    drawing = true;
    const pos = { x: e.clientX, y: e.clientY };
    
    // Avisar os outros que comecei um traço
    channel.publish('start', { 
        x: pos.x, 
        y: pos.y, 
        color: isEraser ? '#ffffff' : colorPicker.value,
        size: lineWidth.value 
    });
    
    drawLocal(pos.x, pos.y, isEraser ? '#ffffff' : colorPicker.value, lineWidth.value);
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    channel.publish('stop', {});
}

function moveDrawing(e) {
    if (!drawing) return;
    const pos = { x: e.clientX, y: e.clientY };
    
    // Envia as coordenadas para todo mundo
    channel.publish('draw', { x: pos.x, y: pos.y });
    
    drawLocal(pos.x, pos.y);
}

// Função que desenha na tela
function drawLocal(x, y, color, size) {
    if (color) ctx.strokeStyle = color;
    if (size) ctx.lineWidth = size;
    
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// OUVIR OS OUTROS USUÁRIOS
channel.subscribe('start', (msg) => {
    ctx.beginPath();
    ctx.strokeStyle = msg.data.color;
    ctx.lineWidth = msg.data.size;
});

channel.subscribe('draw', (msg) => {
    drawLocal(msg.data.x, msg.data.y);
});

channel.subscribe('stop', () => {
    ctx.beginPath();
});

channel.subscribe('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// EVENTOS DO MOUSE
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', moveDrawing);

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    channel.publish('clear', {});
});
