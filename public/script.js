const socket = io();
var settings;
var selectedColor = 0;

function setup() {
    createCanvas(0, 0);
}

function isTimeout(time) {
    return Date.now() - settings.timeout < time;
}

function mouseClicked() {
    const cell = getMouseCell();
    if (!cell) return;
    if (isTimeout(settings.timeoutTime)) return;

    socket.emit('place', cell.x, cell.y, selectedColor, allowed => {
        if (!allowed) return;
        setPixel(cell.x, cell.y, selectedColor);
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

function drawGrid() {
    for (let x = 0; x < settings.grid.length; x++) {
        for (let y = 0; y < settings.grid[x].length; y++) {
            setPixel(x, y, settings.grid[x][y]);
        }
    }
}

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

    console.log(_settings);
    settings = _settings;
    settings.cellSize = Math.floor((Math.min(innerWidth, innerHeight) - 30) / settings.size);

    settings.colors.forEach((_color, i) => {
        const colorButton = document.createElement('button');
        if (i == 0) colorButton.classList.add('active');
        colorButton.addEventListener('click', () => {
            selectedColor = i;
            document.querySelectorAll('.color-button').forEach(button => {
                button.classList.remove('active');
            });
            colorButton.classList.add('active');
        });
        colorButton.classList.add('color-button');
        colorButton.style.backgroundColor = _color;

        document.querySelector('#colorContainer').appendChild(colorButton);
    })

    resizeCanvas(settings.size * settings.cellSize, settings.size * settings.cellSize);
    drawGrid();
})

socket.on('place', setPixel);

socket.on('setTimeout', (timeout) => { settings.timeout = timeout });

function setPixel(x, y, color) {
    if (!settings) return;
    settings.grid[x][y] = color;

    noStroke();
    fill(settings.colors[color]);
    rect(x * settings.cellSize, y * settings.cellSize, settings.cellSize, settings.cellSize);
}

function getMouseCell() {
    const pos = {
        x: Math.floor((mouseX / width) * settings.size),
        y: Math.floor((mouseY / width) * settings.size),
    };
    if (pos.x >= settings.size || pos.x < 0) return null;
    if (pos.y >= settings.size || pos.y < 0) return null;

    return pos;
}