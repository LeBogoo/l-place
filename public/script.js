const socket = io();
var settings;
var currentColor = 0;

var pxs = 50;
var zf = 0.3;
var offset = { x: 0, y: 0 };
var dragging = false;
var canv;

function setup() {
    canv = createCanvas(innerWidth, innerHeight * 0.9);
    canv.elt.addEventListener('click', click)
    noStroke();
}

function isTimeout(time) {
    return Date.now() - settings.timeout < time;
}


function click() {
    if (dragging) return;
    console.log("Clicked!");
    const cell = getMouseCell();

    console.log(cell)
    if (!cell) return;
    if (isTimeout(settings.timeoutTime)) return;

    socket.emit('place', cell.x, cell.y, currentColor, allowed => {
        if (!allowed) return;
        setPixel(cell.x, cell.y, currentColor);
        settings.timeoutTime = Date.now();
    });
}

// functions for use in bots. Free to use!

function timeoutEnd() {
    return new Promise((res, rej) => {
        const i = setInterval(() => {
            if (!isTimeout(settings.timeoutTime)) {
                clearInterval(i);
                res();
            }
        }, 100)
    })
}

/**
 * Places a pixel at the given position if the timeout has expired.
 * Use await place(x,y,color) instead of normal socket.io calls to be sure that the pixel is placed.
 * 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} _color Number between 0 and length of settings.colors
 */
async function place(x, y, _color) {
    await timeoutEnd();
    socket.emit('place', x, y, _color, allowed => {
        if (!allowed) return;
        setPixel(x, y, _color);
        settings.timeoutTime = Date.now();
    });
}

// End of functions for bot use.

socket.on('start', (_settings) => {

    setInterval(() => {
        // if the player has timeout, display the left timeout time in #timeoutLabel.
        if (isTimeout(settings.timeoutTime)) {
            const timeLeft = settings.timeout - (Date.now() - settings.timeoutTime);
            document.getElementById('timeoutLabel').innerText = `Timeout: ${Math.floor(timeLeft / 1000) + 1}s`;
        } else {
            document.getElementById('timeoutLabel').innerText = '';
        }
    });

    settings = _settings;

    settings.colors.forEach((_color, i) => {
        const colorButton = document.createElement('button');
        if (i == 0) colorButton.classList.add('active');
        colorButton.addEventListener('click', () => {
            currentColor = i;
            document.querySelectorAll('.color-button').forEach(button => {
                button.classList.remove('active');
            });
            colorButton.classList.add('active');
        });
        colorButton.classList.add('color-button');
        colorButton.style.backgroundColor = _color;

        document.querySelector('#colorContainer').appendChild(colorButton);
    })

})

socket.on('place', setPixel);

function setPixel(x, y, color) {
    if (!settings) return;
    settings.grid[x][y] = color;
}

function getMouseCell() {
    const x = Math.floor((mouseX + offset.x) / (pxs * zf));
    const y = Math.floor((mouseY + offset.y) / (pxs * zf));
    if (x < 0 || x >= settings.size || y < 0 || y >= settings.size) return null;
    return { x, y };
}

function mouseReleased() {
    setTimeout(() => { dragging = false; }, 200);
}

function mouseDragged() {
    dragging = true;
    offset.x -= mouseX - pmouseX;
    offset.y -= mouseY - pmouseY;
}

function mouseWheel(e) {
    if (e.deltaY < 0) zf += 0.1;
    else zf -= 0.1;
    if (zf > 1) zf = 1;
    if (zf < .1) zf = .1;
}

function getVisibleBox() {
    const x = Math.floor(offset.x / (pxs * zf));
    const y = Math.floor(offset.y / (pxs * zf));
    const w = Math.floor(width / (pxs * zf));
    const h = Math.floor(height / (pxs * zf));
    return { x, y, w, h };
}

function draw() {
    if (!settings) return;
    background(0);
    const bounds = getVisibleBox();
    for (let x = 0; x <= bounds.w; x++) {
        for (let y = 0; y <= bounds.h; y++) {
            const nx = x + bounds.x;
            const ny = y + bounds.y;
            if (nx >= 0 && nx < settings.size && ny >= 0 && ny < settings.size) {
                const c = settings.grid[nx][ny];
                if (c) {
                    fill(settings.colors[settings.grid[x + bounds.x][y + bounds.y]]);
                    rect(x * pxs * zf, y * pxs * zf, pxs * zf, pxs * zf);
                }
            }
        }
    }
}