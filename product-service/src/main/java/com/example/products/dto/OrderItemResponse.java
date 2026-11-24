package com.example.products.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        String color,
        BigDecimal unitPrice,
        int quantity) {
}
