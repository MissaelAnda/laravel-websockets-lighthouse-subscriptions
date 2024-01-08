# Lighhouse laravel websockets

Basic configuration to use [lighthouse's](https://github.com/nuwave/lighthouse) subscriptions with the pusher driver using [beyondcode/laravel-websockets](https://github.com/beyondcode/laravel-websockets).

Just copy all the files to your proyect and add these two service providers to your config/app.php:

```php
<?php

return [
    ...

    'providers' => ServiceProvider::defaultProviders()->merge([
        /*
         * Package Service Providers...
         */
        ...
        \Nuwave\Lighthouse\Subscriptions\SubscriptionServiceProvider::class,

        /*
        * Application Service Providers...
        */
        ...
        App\Providers\LighthouseWebSocketsServiceProvider::class,
    ])->toArray(),
]
```

Or you can change the `channel_manager` to `App\WebSockets\Channels\ChannelManagers\ArrayChannelManager::class` in `config/websockets.php`.

The client implementation can be done using the [WsClient](MissaelAnda/laravel-websockets-lighthouse-subscriptions/resources/js/WsClient.js) like this:

```js
import WsClient from 'WsClient.js';

const ws = new WsClient(
  "ws://localhost:6001/app/Sembrador",
  "http://localhost:8000/graphql"
);
ws.onConnected = () => {
  ws.subscribe(
    `
  subscription ($id: ID!) {
    newMessages(id: $id) {
      id
    }
  }
  `,
    {
      id: 1,
    },
    {
      Authorization: "Bearer token",
    }
  );
};

ws.onMessage = console.log
ws.onSubscribed = (channel) => console.log("Successfully subscribed to " + channel);
ws.onUnsubscribed = (channel) =>
  console.log("Successfully unsubscribed from " + channel);
ws.connect();

```