package com.example.products.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.products.dto.CreateOrderRequest;
import com.example.products.dto.OrderItemResponse;
import com.example.products.dto.OrderResponse;
import com.example.products.model.CustomerOrder;
import com.example.products.model.Product;
import com.example.products.repository.OrderRepository;
import com.example.products.repository.ProductRepository;

@Service
public class OrderService {

    private final OrderRepository orders;
    private final ProductRepository products;

    public OrderService(OrderRepository orders, ProductRepository products) {
        this.orders = orders;
        this.products = products;
    }

    @Transactional
    public OrderResponse placeOrder(String customerEmail, CreateOrderRequest request) {
        CustomerOrder order = new CustomerOrder(customerEmail);
        for (var item : request.items()) {
            Product product = products.findById(item.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            order.addItem(product, item.quantity());
        }
        order.markTestPaid();
        return toResponse(orders.save(order));
    }

    private OrderResponse toResponse(CustomerOrder order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getColor(),
                        item.getUnitPrice(),
                        item.getQuantity()))
                .toList();
        return new OrderResponse(
                order.getId(),
                order.getCustomerEmail(),
                order.getCreatedAt(),
                order.getTotalAmount(),
                order.getStatus().name(),
                items);
    }
}
