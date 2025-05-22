import { Encoder } from './Encoder';
import Player from './Player';

export class CloudConnection {
    constructor({ user = 'thug', projectId = '843162693', playerProvider }) {
        this.user = user;
        this.projectId = projectId;
        this.playerProvider = playerProvider;
        this.ws = null;
        this.playerID = Math.floor(Math.random() * 6000);
        this.encoder = new Encoder();
        this.interval = null;

        this.connectWebSocket();
    }

    connectWebSocket() {
        this.ws = new WebSocket(`wss://clouddata.turbowarp.org/`);

        this.ws.onopen = () => {
            this.handshake();
            this.interval = setInterval(() => this.sendCloudData(), 40);
        };

        this.ws.onclose = () => {
            if (this.interval) clearInterval(this.interval);
            setTimeout(() => this.connectWebSocket(), 1000);
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };
    }

    handshake() {
        this.ws.send(JSON.stringify({
            method: 'handshake',
            user: this.user,
            project_id: this.projectId
        }) + "\n");
    }

    sendCloudData() {
        if (this.ws.readyState !== WebSocket.OPEN) return;

        const player = this.playerProvider.get("local");
        if (!player) return;

        if (player.breakingBlocks.size > 0) {
            player.breakingBlockIdx = (player.breakingBlockIdx + 1) % player.breakingBlocks.size;
        } else {
            player.breakingBlockIdx = 0;
        }

        let currentBreakingBlock = Array.from(player.breakingBlocks)[player.breakingBlockIdx];

        this.encoder.initReader("");
        this.encoder.writeString(player.username);
        this.encoder.writeNumber(this.playerID);

        const base = this.encoder.getResult();
        this.encoder.initReader(String(this.mathMod(23, 10)) + base);

        this.encoder.writeNumber(player.helmet); // helmet
        this.encoder.writeNumber(player.chestplate); // chestplate
        this.encoder.writeNumber(player.chatIdx); // chat
        this.encoder.writeNumber(player.claimIdx); // claim idx
        this.encoder.writeNumber(player.x * 32);
        this.encoder.writeNumber(player.y * 32);
        this.encoder.writeNumber(currentBreakingBlock);

        const cloudVarIndex = Math.floor(Math.random() * 9) + 1;
        this.ws.send(JSON.stringify({
            method: 'set',
            user: this.user,
            project_id: this.projectId,
            name: "☁ CLOUD" + cloudVarIndex,
            value: this.encoder.getResult()
        }) + "\n");
    }

    handleMessage(data) {
        const messages = data.trim().split('\n');
        for (const msgStr of messages) {
            const msg = JSON.parse(msgStr);
            if (msg.method === "set" && msg.value) {
                this.decodePlayerValue(msg.value);
            }
        }
    }

    decodePlayerValue(valueStr) {
        this.encoder.initReader("=" + valueStr);
        this.encoder.parseIdx += 2;

        this.encoder.readString();
        const playerName = this.encoder.getValue();

        this.encoder.readNumber();
        const playerID = this.encoder.getValue();

        this.encoder.readNumber();
        const helmet = this.encoder.getValue();

        this.encoder.readNumber();
        const chestplate = this.encoder.getValue();

        this.encoder.readNumber();
        const chatIdx = this.encoder.getValue();

        this.encoder.readNumber();
        const claimIdx = this.encoder.getValue();

        this.encoder.readNumber();
        const x = this.encoder.getValue() / 32;

        this.encoder.readNumber();
        const y = this.encoder.getValue() / 32;

        if (!this.playerProvider.has(playerName)) {
            let newPlayer = new Player(playerName, playerID, x, y, false);
            newPlayer.id = playerID;
            newPlayer.helmet = helmet;
            newPlayer.chestplate = chestplate;
            newPlayer.chatIdx = chatIdx;
            newPlayer.claimIdx = claimIdx;
            newPlayer.x = x;
            newPlayer.y = y;
            window.players.set(newPlayer.id, newPlayer);
        } else {
            const player = this.playerProvider.get(playerID);
            player.id = playerID;
            player.helmet = helmet;
            player.chestplate = chestplate;
            player.chatIdx = chatIdx;
            player.claimIdx = claimIdx;
            player.x = x;
            player.y = y;
        }

        let bub = this.playerProvider.get(playerID);
        bub.lastUpdate = Date.now();

        //console.log(this.playerProvider.get(playerID));
    }


    mathMod(a, b) {
        return ((a % b) + Math.abs(b)) % Math.abs(b);
    }

    close() {
        if (this.interval) clearInterval(this.interval);
        if (this.ws) this.ws.close();
    }
}
