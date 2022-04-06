const socket = io();
var settings;
var color = 0;

var timeoutTime = 0;

function setup() {
    createCanvas(0, 0);
}

function isTimeout(time) {
    return Date.now() - settings.timeout < time;
}

function mouseClicked(e) {
    const cell = getMouseCell();
    if (!cell) return;
    if (isTimeout(timeoutTime)) return;

    socket.emit('place', cell.x, cell.y, color, allowed => {
        if (!allowed) return;
        setPixel(cell.x, cell.y, color);
        timeoutTime = Date.now();
    });
}

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
        if (isTimeout(timeoutTime)) {
            const timeLeft = settings.timeout - (Date.now() - timeoutTime);
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
        colorButton.addEventListener('click', () => { color = i; });

        colorButton.classList.add('color-button');
        colorButton.style.backgroundColor = _color;

        document.querySelector('#colorContainer').appendChild(colorButton);
    })

    resizeCanvas(settings.size * settings.cellSize, settings.size * settings.cellSize);
    drawGrid();
})

socket.on('place', setPixel);

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