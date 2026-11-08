<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Payment driver
    |--------------------------------------------------------------------------
    |
    | "stripe" charges real cards through Stripe Checkout. "sandbox" simulates a
    | checkout for local development and is refused in production.
    |
    */

    'driver' => env('PAYMENT_DRIVER', 'sandbox'),

    'currency' => strtolower((string) env('PAYMENT_CURRENCY', 'usd')),

];
