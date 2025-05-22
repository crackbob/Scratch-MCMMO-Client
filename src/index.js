const { default: blockData } = require("./blockData");
const { CloudConnection } = require("./cloudConnection");
const { default: Player } = require("./Player");

const canvas = document.createElement("canvas");
document.body.append(canvas);
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

window.BLOCK_SIZE = 16;
const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 500;

const atlas = new Image();
atlas.src = "texture-atlas.png";

const ATLAS_TILE_SIZE = 16;

function drawTile(id, x, y) {
    if (id === 0) return;
    const atlasCols = atlas.width / ATLAS_TILE_SIZE;
    const sx = (id % atlasCols) * ATLAS_TILE_SIZE;
    const sy = Math.floor(id / atlasCols) * ATLAS_TILE_SIZE;
    ctx.drawImage(atlas, sx, sy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE, Math.floor(x), Math.floor(y), BLOCK_SIZE, BLOCK_SIZE);
}

const keys = {};
let showGrid = false;

window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key.toLowerCase() === "g") showGrid = !showGrid;
});
window.addEventListener("keyup", e => keys[e.key] = false);

let mouseX = 0,
    mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

let camX = 0,
    camY = 0;

const players = new Map();
window.players = players;
const localPlayer = new Player("thug", "local", 125, 30, true);
players.set(localPlayer.id, localPlayer);

canvas.addEventListener("mousedown", (e) => {
    const worldMouseX = camX + e.clientX;
    const worldMouseY = camY + e.clientY;
    const blockX = Math.floor(worldMouseX / BLOCK_SIZE);
    const blockY = Math.floor(worldMouseY / BLOCK_SIZE);
    const flippedY = WORLD_HEIGHT - blockY - 1;
    const blockIndex = flippedY * WORLD_WIDTH + blockX;

    if (blockData[blockIndex] !== 0) {
        localPlayer.breakingBlocks.add(blockIndex);
    }

    if (
        blockX >= 0 && blockX < WORLD_WIDTH &&
        flippedY >= 0 && flippedY < WORLD_HEIGHT
    ) {
        if (e.button === 0) {
            blockData[blockIndex] = 0;
        } else if (e.button === 2) {
            blockData[blockIndex] = 2;
        }
    }
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

function drawGrid(camX, camY) {
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    const startCol = Math.floor(camX / BLOCK_SIZE);
    const endCol = Math.ceil((camX + canvas.width) / BLOCK_SIZE);
    const startRow = Math.floor(camY / BLOCK_SIZE);
    const endRow = Math.ceil((camY + canvas.height) / BLOCK_SIZE);
    for (let x = startCol; x <= endCol; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE - camX, 0);
        ctx.lineTo(x * BLOCK_SIZE - camX, canvas.height);
        ctx.stroke();
    }
    for (let y = startRow; y <= endRow; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE - camY);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE - camY);
        ctx.stroke();
    }
}

function update() {
    for (const player of players.values()) {
        player.update(keys);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    camX = localPlayer.x * BLOCK_SIZE - canvas.width / 2 + (localPlayer.width * BLOCK_SIZE) / 2;
    camY = (WORLD_HEIGHT - localPlayer.y - localPlayer.height) * BLOCK_SIZE - canvas.height / 2 + (localPlayer.height * BLOCK_SIZE) / 2;

    const startCol = Math.floor(camX / BLOCK_SIZE);
    const endCol = Math.ceil((camX + canvas.width) / BLOCK_SIZE);
    const startRow = Math.floor(camY / BLOCK_SIZE);
    const endRow = Math.ceil((camY + canvas.height) / BLOCK_SIZE);

    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            if (row < 0 || col < 0 || row >= WORLD_HEIGHT || col >= WORLD_WIDTH) continue;
            const flippedRow = WORLD_HEIGHT - row - 1;
            const index = flippedRow * WORLD_WIDTH + col;
            const block = blockData[index];
            drawTile(block, col * BLOCK_SIZE - camX, row * BLOCK_SIZE - camY);
        }
    }

    if (showGrid) drawGrid(camX, camY);

    for (const player of players.values()) {
        player.draw(ctx, camX, camY);
        if (player === localPlayer) continue;

        const playerX = player.x * BLOCK_SIZE + (player.width * BLOCK_SIZE) / 2;
        const playerY = (WORLD_HEIGHT - player.y - player.height) * BLOCK_SIZE + (player.height * BLOCK_SIZE) / 2;

        const screenX = playerX - camX;
        const screenY = playerY - camY;

        const localCenterX = localPlayer.x * BLOCK_SIZE + (localPlayer.width * BLOCK_SIZE) / 2 - camX;
        const localCenterY = (WORLD_HEIGHT - localPlayer.y - localPlayer.height) * BLOCK_SIZE + (localPlayer.height * BLOCK_SIZE) / 2 - camY;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(localCenterX, localCenterY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const worldMouseX = camX + mouseX;
    const worldMouseY = camY + mouseY;
    const blockX = Math.floor(worldMouseX / BLOCK_SIZE);
    const blockY = Math.floor(worldMouseY / BLOCK_SIZE);
    const flippedY = WORLD_HEIGHT - blockY - 1;
    const blockIndex = flippedY * WORLD_WIDTH + blockX;
    localPlayer.selectedBlock = blockIndex;

    if (
        blockX >= 0 && blockX < WORLD_WIDTH &&
        flippedY >= 0 && flippedY < WORLD_HEIGHT
    ) {
        const block = blockData[blockIndex];
        ctx.fillStyle = "rgba(255,255,0,0.3)";
        ctx.fillRect(
            blockX * BLOCK_SIZE - camX,
            blockY * BLOCK_SIZE - camY,
            BLOCK_SIZE,
            BLOCK_SIZE
        );
        ctx.fillStyle = "black";
        ctx.font = "16px sans-serif";
        ctx.fillText(
            `${blockIndex}: ${block}`,
            blockX * BLOCK_SIZE - camX + 4,
            blockY * BLOCK_SIZE - camY + 16
        );
    }

    ctx.fillText("Minecraft-ish MMO Thuggary", 10, 20);
    ctx.fillText(`X: ${Math.round(localPlayer.x)} Y: ${Math.round(localPlayer.y)}`, 10, 40);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

const connection = new CloudConnection({
    user: "thug",
    projectId: "843162693",
    playerProvider: players
});