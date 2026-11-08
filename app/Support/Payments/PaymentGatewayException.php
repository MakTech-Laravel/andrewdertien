<?php

namespace App\Support\Payments;

use RuntimeException;

/**
 * A payment could not be processed. The message is safe to show to the person
 * using the site; provider details belong in the log.
 */
class PaymentGatewayException extends RuntimeException {}
