<?php

namespace App\WebSockets\Channels\ChannelManagers;

use BeyondCode\LaravelWebSockets\WebSockets\Channels\Channel;
use BeyondCode\LaravelWebSockets\WebSockets\Channels\ChannelManagers\ArrayChannelManager as BaseArrayChannelManager;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Ratchet\ConnectionInterface;
use Nuwave\Lighthouse\Subscriptions\Contracts\StoresSubscriptions as Storage;

class ArrayChannelManager extends BaseArrayChannelManager
{
    protected function determineChannelClass(string $channelName): string
    {
        if (Str::startsWith($channelName, 'private-lighthouse-')) {
            return PrivateLighthouseChannel::class;
        }

        return parent::determineChannelClass($channelName);
    }
}
