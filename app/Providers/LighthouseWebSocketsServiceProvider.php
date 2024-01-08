<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use BeyondCode\LaravelWebSockets\WebSockets\Channels\ChannelManager;
use App\WebSockets\Channels\ChannelManagers\ArrayChannelManager;

class LighthouseWebSocketsServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(ChannelManager::class, ArrayChannelManager::class);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
