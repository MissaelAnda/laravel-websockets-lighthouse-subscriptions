<?php

namespace App\WebSockets\Channels;

use BeyondCode\LaravelWebSockets\WebSockets\Channels\PrivateChannel;
use Nuwave\Lighthouse\Subscriptions\Contracts\StoresSubscriptions;
use Ratchet\ConnectionInterface;
use Illuminate\Support\Str;

class LighthousePrivateChannel extends PrivateChannel
{
    public function unsubscribe(ConnectionInterface $connection): void
    {
        parent::unsubscribe($connection);

        if (Str::startsWith($this->channelName, 'private-lighthouse-') && !$this->hasConnections()) {
            static::lighthouseSubscriptionsStorage()->deleteSubscriber($this->channelName);
        }
    }

    protected static function lighthouseSubscriptionsStorage(): StoresSubscriptions
    {
        return app(StoresSubscriptions::class);
    }
}
