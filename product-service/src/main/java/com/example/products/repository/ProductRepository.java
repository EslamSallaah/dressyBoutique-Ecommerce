package com.example.products.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.products.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOrderByIdAsc();

    List<Product> findByCategoryIgnoreCaseOrderByIdAsc(String category);
}
