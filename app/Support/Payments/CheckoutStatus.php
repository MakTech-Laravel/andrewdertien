<?php

namespace App\Support\Payments;

final readonly class CheckoutStatus
{
    private function __construct(
        public bool $isPaid,
        public bool $isOpen,
        public ?string $paymentId = null,
    ) {}

    public static function paid(?string $paymentId): self
    {
        return new self(isPaid: true, isOpen: false, paymentId: $paymentId);
    }

    public static function open(): self
    {
        return new self(isPaid: false, isOpen: true);
    }

    public static function closed(): self
    {
        return new self(isPaid: false, isOpen: false);
    }
}
