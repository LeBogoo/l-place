require('dotenv').config();

const fs = require('fs');
const express = require('express');

const app = express();
const http = require('http');

const server = http.createServer(app);
const cors = require('cors');

const io = require('socket.io')(server);

const port = process.env.PORT || 8080;

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
    console.log(`${new Date().toString()} | Server running at port ${port}`);
});

app.use(express.static('./public'));

app.use(cors({ 'origin': '*' }))


const saveFile = process.env.SAVEFILE || "grid.json";

var grid = fs.existsSync(saveFile) ? JSON.parse(fs.readFileSync(saveFile, 'utf8')) : [];

const settings = {
    size: 70,
    colors,
    grid,
    timeout: 10000,
}

const timeouts = {};

if (grid.length == 0) {
    for (let x = 0; x < settings.size; x++) {
        grid[x] = [];
        for (let y = 0; y < settings.size; y++) {
            grid[x][y] = colors.length - 1;
        }
    }
}

setInterval(() => {
    fs.writeFileSync(saveFile, JSON.stringify(grid));
}, 10000);

function isTimeout(time) {
    return Date.now() - settings.timeout < time;
}

io.on('connection', function (socket) {
    var ip = socket.handshake.headers['x-forwarded-for'];
    var banList = fs.existsSync('banlist.json') ? JSON.parse(fs.readFileSync('banlist.json', 'utf8')) : [];
    if (banList.includes(ip)) {
        socket.disconnect();
        console.log(`${new Date().toString()} | Banned Player (${ip}) was disconnected.`);
    }
    else {

        console.log(`${new Date().toString()} | ${ip} connected!`)
    }

    if (!timeouts[ip]) timeouts[ip] = 0;

    socket.on('place', (_x, _y, _color, cb) => {
        var banList = fs.existsSync('banlist.json') ? JSON.parse(fs.readFileSync('banlist.json', 'utf8')) : [];
        if (banList.includes(ip)) socket.disconnect();

        if (isTimeout(timeouts[ip])) return cb(false);
        console.log(`${new Date().toString()} | ${ip} placed at ${_x}, ${_y}`);

        cb(true);
        timeouts[ip] = Date.now();

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

    socket.on('disconnect', () => {
        console.log(`${new Date().toString()} | ${ip} disconnected!`);
    });

    socket.on('fastplace', (_x, _y, _color, cb) => {
        if (ip != process.env.ADMIN_IP) return cb(false);
        cb(true);
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

    socket.on('setTimeout', (_delay) => {
        console.log(`${new Date().toString()} | Set delay to ${_delay}`);
        if (ip != process.env.ADMIN_IP) return;
        const delay = parseInt(_delay);

        if (isNaN(delay)) return;
        if (delay < 0) return;

        settings.timeout = delay;
        io.emit('setTimeout', delay);
    })

    socket.emit('start', { ...settings, timeoutTime: timeouts[ip] })
});
