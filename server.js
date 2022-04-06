require('dotenv').config();

const express = require('express');

const app = express();
const http = require('http');

const server = http.createServer(app);
const cors = require('cors');

const io = require('socket.io')(server);

const port = process.env.PORT;

const colors = [
    '#820080',
    '#CF6EE4',
    '#0000EA',
    '#0083C7',
    '#00D3DD',
    '#02BE01',
    '#94E044',
    '#E5D900',
    '#A06A42',
    '#E59500',
    '#E50000',
    '#FFA7D1',
    '#222222',
    '#888888',
    '#FFFFFF'
]

server.listen(port, function () {
    console.log('Server is running at port %d', port);
});

app.use(express.static('./public'));

app.use(cors({ 'origin': '*' }))

var grid = [];

const settings = {
    size: 70,
    colors,
    grid,
    timeout: 5000,
}

for (let x = 0; x < settings.size; x++) {
    grid[x] = [];
    for (let y = 0; y < settings.size; y++) {
        grid[x][y] = colors.length - 1;
    }
}

function isTimeout(time) {
    return Date.now() - settings.timeout < time;
}

io.on('connection', function (socket) {
    var lastPlace = 0;

    socket.on('place', (_x, _y, _color, cb) => {
        if (isTimeout(lastPlace)) return cb(false);
        cb(true);
        lastPlace = Date.now();

        const x = parseInt(_x);
        const y = parseInt(_y);
        const color = parseInt(_color);
        if (isNaN(color) || isNaN(x) || isNaN(y)) return;
        if (x >= settings.size || x < 0) return;
        if (y >= settings.size || y < 0) return;
        if (color >= colors.length || color < 0) return;

        grid[x][y] = _color;

        io.emit('place', x, y, color);
    })

    socket.emit('start', settings)
});
