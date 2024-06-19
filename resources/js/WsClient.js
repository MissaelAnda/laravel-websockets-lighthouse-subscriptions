export default class WsClient {
    socketId = null;
    pingingInterval = null;
    channels = [];
    onConnected = () => { };
    onSubscribed = (channel) => { };
    onUnsubscribed = (channel) => { };
    onMessage = (message) => { };
    onPing = () => { };
    onPong = () => { };
    onDisconnected = (info) => { };

    constructor(wsUrl, graphQlUrl = null) {
        this.wsUrl = wsUrl;
        this.graphQlUrl = graphQlUrl ?? wsUrl;
    }

    connect(timeout = 10) {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.onmessage = this.handleMessage;
        this.ws.onclose = this.disconnected;

        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < timeout * 10; i++) {
                await new Promise(r => setTimeout(r, 100));
                if (this.isConnected()) {
                    resolve(this.socketId);
                    return;
                }
            }

            reject(new Error('Timed out'));
        });
    }

    disconnected = (event) => {
        this.socketId = null;
        this.channels = [];
        this.stopPinging();
        this.onDisconnected(event);
    }

    disconnect() {
        this.ws.close();
    }

    handleMessage = (e) => {
        const data = JSON.parse(e.data);
        switch (data.event) {
            case "pusher:connection_established":
                const payload = JSON.parse(data.data);
                this.socketId = payload.socket_id;
                this.startPinging();
                this.onConnected();
                break;

            case "pusher:pong":
                this.onPong();
                break;

            case "pusher_internal:subscription_succeeded":
                this.channels.push(data.channel);
                this.onSubscribed(data.channel);
                break;

            default:
                this.onMessage(data)
        }
    };

    async subscribe(query, variables = {}, headers = {}) {
        if (!this.isConnected()) throw new Error("The ws client is not connected.");

        let response = await fetch(this.graphQlUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify({
                query,
                variables,
            }),
        });
        let data = await response.json();

        const channel = data?.extensions?.lighthouse_subscriptions.channel;
        if (!channel) throw new Error("No channel returned from query");

        response = await fetch(this.graphQlUrl + "/subscriptions/auth", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify({
                channel_name: channel,
                socket_id: this.socketId,
            }),
        });
        data = await response.json();

        const auth = data?.auth;

        this.send({
            event: "pusher:subscribe",
            data: {
                channel,
                auth,
            },
        });
    }

    startPinging() {
        if (!this.pingingInterval) {
            this.pingingInterval = setInterval((_) => this.ping(), 30 * 1000); // Ping every 30 seconds
        }
    }

    stopPinging() {
        if (this.pingingInterval) {
            clearInterval(this.pingingInterval);
            this.pingingInterval = null;
        }
    }

    ping() {
        this.send({ event: "pusher:ping", data: {} });
        this.onPing();
    }

    unsubscribe(channel) {
        const id = this.channels.indexOf(channel);
        if (id < 0) throw new Error(`The client is not subscribed to ${channel}`);

        this.send({
            event: "pusher:unsubscribe",
            data: { channel },
        });
        this.channels.splice(id, 1);
        this.onUnsubscribed(channel);
    }

    send(data = {}) {
        this.ws.send(JSON.stringify(data));
    }

    isConnected = () => this.socketId !== null;
}
