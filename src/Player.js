const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 500;

export default class Player {
    constructor(username, id, x, y, isLocal = false) {
        this.username = username;
        this.id = id;
        this.helmet = 0;
        this.chestplate = 0;
        this.chatIdx = 0;
        this.claimIdx = 0;
        this.x = x;
        this.y = y;
        this.dir = 90;
        this.selectedBlock = 0;
        this.breakingBlockIdx = 0;
        this.breakingBlocks = new Set();
        this.width = 0.6;
        this.height = 1;
        this.speed = 0.3;
        this.isLocal = isLocal;
        this.lastUpdate = Date.now();

        this.playerImage = new Image();
        this.playerImage.src = "player.png";

    }

    update(keys) {
        
        if (!this.isLocal) {
            if (this.lastUpdate + 10000 < Date.now()) {
                window.players.delete(this.id);
            }

        } else {
            if (keys["ArrowLeft"] || keys["a"]) this.x -= this.speed;
            if (keys["ArrowRight"] || keys["d"]) this.x += this.speed;
            if (keys["ArrowUp"] || keys["w"]) this.y += this.speed;
            if (keys["ArrowDown"] || keys["s"]) this.y -= this.speed;

            this.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.x));
            this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.height, this.y));
        }
    }

    draw(ctx, camX, camY) {
        const px = this.x * window.BLOCK_SIZE - camX;
        const py = (WORLD_HEIGHT - this.y - this.height) * window.BLOCK_SIZE - camY;
        ctx.fillText(this.username, px - 5, py - 15);
        ctx.drawImage(this.playerImage, px, py, this.width * window.BLOCK_SIZE, this.height * window.BLOCK_SIZE);
    }
}