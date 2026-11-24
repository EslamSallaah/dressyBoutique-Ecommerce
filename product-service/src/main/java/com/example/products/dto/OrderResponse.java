package com.example.products.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String customerEmail,
        Instant createdAt,
        BigDecimal totalAmount,
        String status,
        List<OrderItemResponse> items) {
}
