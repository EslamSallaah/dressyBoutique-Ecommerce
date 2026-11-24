package com.example.ecommerce;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    private final JsonMapper objectMapper = JsonMapper.builder().build();

    @Test
    void registrationIssuesJwtThatCanAuthenticateCurrentUser() throws Exception {
        String email = "customer-" + UUID.randomUUID() + "@example.com";
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Casey Customer","email":"%s","password":"long-enough-password"}
                        """.formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.name").value("Casey Customer"))
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = response.get("token").asString();
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.name").value("Casey Customer"));

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"long-enough-password"}
                        """.formatted(email.toUpperCase(java.util.Locale.ROOT))))
                .andExpect(status().isOk())
                .andReturn();
        String loginToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asString();
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void registrationRejectsInvalidInputAndDuplicateEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"","email":"not-an-email","password":"short"}
                        """))
                .andExpect(status().isBadRequest());

        String email = "duplicate-" + UUID.randomUUID() + "@example.com";
        String request = """
                {"name":"Casey Customer","email":"%s","password":"long-enough-password"}
                """.formatted(email);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isConflict());
    }

    @Test
    void protectedProfileRejectsMissingOrInvalidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"missing@example.com","password":"long-enough-password"}
                        """))
                .andExpect(status().isUnauthorized());
    }
}
