package com.example.products.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 254)
    private String customerEmail;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.AWAITING_PAYMENT;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLine> items = new ArrayList<>();

    protected CustomerOrder() {
    }

    public CustomerOrder(String customerEmail) {
        this.customerEmail = customerEmail;
        this.createdAt = Instant.now();
    }

    public void addItem(Product product, int quantity) {
        OrderLine item = new OrderLine(
                this,
                product.getId(),
                product.getName(),
                product.getColor(),
                product.getPrice(),
                quantity);
        items.add(item);
        totalAmount = totalAmount.add(item.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
    }

    public Long getId() {
        return id;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void markTestPaid() {
        this.status = OrderStatus.TEST_PAID;
    }

    public List<OrderLine> getItems() {
        return List.copyOf(items);
    }
}
