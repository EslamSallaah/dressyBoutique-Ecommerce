package com.example.products;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Test
    void catalogReturnsSeededProductsAndSupportsCategoryFilter() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(8));

        mockMvc.perform(get("/api/products").param("category", "Accessories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].category").value("Accessories"));
    }

    @Test
    void ordersRequireJwtAndCreateTestPurchase() throws Exception {
        String request = """
                {"items":[{"productId":1,"quantity":2}]}
                """;
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isUnauthorized());

        Instant now = Instant.now();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                JwtClaimsSet.builder()
                        .issuer("ecommerce-identity")
                        .subject("buyer@example.com")
                        .issuedAt(now)
                        .expiresAt(now.plus(1, ChronoUnit.HOURS))
                        .build()))
                .getTokenValue();

        mockMvc.perform(post("/api/orders")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerEmail").value("buyer@example.com"))
                .andExpect(jsonPath("$.totalAmount").value(296.00))
                .andExpect(jsonPath("$.status").value("TEST_PAID"))
                .andExpect(jsonPath("$.items[0].quantity").value(2));

        mockMvc.perform(post("/api/orders")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"items":[{"productId":1,"quantity":11}]}
                        """))
                .andExpect(status().isBadRequest());
    }
}
