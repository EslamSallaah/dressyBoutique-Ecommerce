package com.example.products.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.products.model.CustomerOrder;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {
}
