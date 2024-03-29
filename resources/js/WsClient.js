export default class WsClient {
    socketId = null;
    channels = [];
    onConnected = () => { };
    onSubscribed = (channel) => { };
    onUnsubscribed = (channel) => { };
    onMessage = (message) => { };

    constructor(wsUrl, graphQlUrl = null) {
        this.wsUrl = wsUrl;
        this.graphQlUrl = graphQlUrl ?? wsUrl;
    }

    connect() {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.onmessage = this.handleMessage;
    }

    handleMessage = (e) => {
        const data = JSON.parse(e.data);
        switch (data.event) {
            case "pusher:connection_established":
                const payload = JSON.parse(data.data);
                this.socketId = payload.socket_id;
                this.onConnected();
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