package com.example.products.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(@NotEmpty @Size(max = 50) List<@Valid OrderItemRequest> items) {
}
