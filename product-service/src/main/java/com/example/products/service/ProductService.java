package com.example.products.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.products.model.Product;
import com.example.products.repository.ProductRepository;

@Service
public class ProductService implements CommandLineRunner {

    private final ProductRepository products;

    public ProductService(ProductRepository products) {
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<Product> findProducts(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return products.findAllByOrderByIdAsc();
        }
        return products.findByCategoryIgnoreCaseOrderByIdAsc(category.trim().toLowerCase(Locale.ROOT));
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (products.count() != 0) {
            return;
        }

        products.saveAll(List.of(
                new Product("The Everyday Blazer", "Clothing", new BigDecimal("148.00"),
                        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
                        "A relaxed, softly structured layer made for every day.", "Oatmeal", "Bestseller"),
                new Product("Sunday Knit", "Clothing", new BigDecimal("96.00"),
                        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85",
                        "An easy-fitting cotton knit with a little extra softness.", "Ivory", "New"),
                new Product("Studio Trouser", "Clothing", new BigDecimal("128.00"),
                        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
                        "A tailored wide leg that moves with you, from desk to dinner.", "Charcoal", null),
                new Product("Weekend Tote", "Accessories", new BigDecimal("72.00"),
                        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
                        "Room for your everyday essentials in sturdy organic canvas.", "Natural", null),
                new Product("Soft Form Shirt", "Clothing", new BigDecimal("88.00"),
                        "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85",
                        "A crisp, breathable shirt with a relaxed drape.", "Cloud", "Limited"),
                new Product("City Crossbody", "Accessories", new BigDecimal("110.00"),
                        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
                        "A compact, hands-free favorite in supple recycled leather.", "Cognac", null),
                new Product("Sunday Set", "Clothing", new BigDecimal("132.00"),
                        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
                        "Your off-duty uniform: an easy layer and matching relaxed short.", "Sage", "Bestseller"),
                new Product("Everyday Cap", "Accessories", new BigDecimal("42.00"),
                        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85",
                        "A low-profile cotton cap, finished with a tonal embroidered mark.", "Stone", null)));
    }
}
