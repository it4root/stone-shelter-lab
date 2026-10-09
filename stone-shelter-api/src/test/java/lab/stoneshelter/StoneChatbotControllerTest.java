package lab.stoneshelter;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.core.util.Json31;
import io.swagger.v3.core.util.Yaml31;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import lab.stoneshelter.controllers.StoneChatbotController;
import lab.stoneshelter.handlers.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = StoneChatbotControllerTest.ChatConfiguration.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class StoneChatbotControllerTest {
    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration(excludeName = {
            "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
            "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration",
            "org.springframework.boot.liquibase.autoconfigure.LiquibaseAutoConfiguration",
            "org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration"})
    @Import({StoneChatbotController.class, ApiExceptionHandler.class})
    static class ChatConfiguration {}

    @Autowired private RestTestClient restClient;

    @Test
    void returnsTheExactStubForUnrelatedMessagesAndContextsWithoutADatabase() throws Exception {
        JsonNode expected = Json31.mapper().readTree("""
                {"text":"Here are some stones you might like.","stones":[{"id":1,"name":"Mars"},{"id":3,"name":"Luna"}]}
                """);
        for (Object context : new Object[]{null, Map.of(), Map.of("stoneId", 1), Map.of("stoneId", 9007199254740991L)}) {
            var stoneChatMessageRequest = validRequest();
            stoneChatMessageRequest.put("context", context);
            stoneChatMessageRequest.put("message", "x".repeat(2000));
            assertThat(Json31.mapper().readTree(restClient.post().uri("/api/v1/chat/messages")
                    .contentType(MediaType.APPLICATION_JSON).body(stoneChatMessageRequest).exchange()
                    .expectStatus().isOk().expectHeader().doesNotExist("Location")
                    .expectBody(String.class).returnResult().getResponseBody())).isEqualTo(expected);
        }
        assertThat(Json31.mapper().readTree(restClient.post().uri("/api/v1/chat/messages")
                .contentType(MediaType.APPLICATION_JSON).body(validRequest()).exchange().expectStatus().isOk()
                .expectBody(String.class).returnResult().getResponseBody())).isEqualTo(expected);
    }

    static Stream<Object> invalidRequests() {
        List<Object> requests = new ArrayList<>();
        requests.add("{");
        requests.add("null");
        for (String field : List.of("conversationId", "message")) {
            var stoneChatMessageRequest = validRequest();
            stoneChatMessageRequest.remove(field);
            requests.add(stoneChatMessageRequest);
            stoneChatMessageRequest = validRequest();
            stoneChatMessageRequest.put(field, null);
            requests.add(stoneChatMessageRequest);
        }
        for (String message : List.of("", " \t\n", "x".repeat(2001))) {
            var stoneChatMessageRequest = validRequest();
            stoneChatMessageRequest.put("message", message);
            requests.add(stoneChatMessageRequest);
        }
        var stoneChatMessageRequest = validRequest();
        stoneChatMessageRequest.put("conversationId", "not-a-uuid");
        requests.add(stoneChatMessageRequest);
        for (Object stoneId : List.of(0, -1, 9007199254740992L, "not-an-id")) {
            stoneChatMessageRequest = validRequest();
            stoneChatMessageRequest.put("context", Map.of("stoneId", stoneId));
            requests.add(stoneChatMessageRequest);
        }
        return requests.stream();
    }

    @ParameterizedTest
    @MethodSource("invalidRequests")
    void rejectsInvalidChatRequestsWithProblemDetail(Object stoneChatMessageRequest) {
        restClient.post().uri("/api/v1/chat/messages").contentType(MediaType.APPLICATION_JSON)
                .body(stoneChatMessageRequest).exchange().expectStatus().isBadRequest()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .expectBody().jsonPath("$.status").isEqualTo(400).jsonPath("$.detail").isNotEmpty();
    }

    @Test
    void rejectsAMissingBodyAndAcceptsANullStoneIdentifier() {
        restClient.post().uri("/api/v1/chat/messages").contentType(MediaType.APPLICATION_JSON)
                .exchange().expectStatus().isBadRequest().expectBody().jsonPath("$.status").isEqualTo(400);
        var stoneChatMessageRequest = validRequest();
        var stoneChatContext = new HashMap<String, Object>();
        stoneChatContext.put("stoneId", null);
        stoneChatMessageRequest.put("context", stoneChatContext);
        restClient.post().uri("/api/v1/chat/messages").body(stoneChatMessageRequest)
                .exchange().expectStatus().isOk();
    }

    @Test
    void generatesTheChatContractInJsonAndYaml() throws Exception {
        JsonNode openApi = Json31.mapper().readTree(restClient.get().uri("/v3/api-docs").exchange()
                .expectStatus().isOk().expectBody(String.class).returnResult().getResponseBody());
        JsonNode operation = openApi.at("/paths/~1api~1v1~1chat~1messages/post");
        assertThat(operation.path("description").asText()).contains("Stub", "No AI", "server conversation storage");
        assertThat(operation.at("/requestBody/content/application~1json/schema/$ref").asText())
                .isEqualTo("#/components/schemas/StoneChatMessageRequest");
        assertThat(operation.path("responses").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactlyInAnyOrder("200", "400");
        assertThat(operation.at("/responses/200/content/application~1json/schema/$ref").asText())
                .isEqualTo("#/components/schemas/StoneChatMessageResponse");
        assertThat(operation.at("/responses/400/content/application~1problem+json/schema/$ref").asText())
                .isEqualTo("#/components/schemas/ProblemDetail");
        JsonNode schemas = openApi.at("/components/schemas");
        assertThat(schemas.at("/StoneChatMessageRequest/required"))
                .containsExactlyInAnyOrder(Json31.mapper().valueToTree("conversationId"), Json31.mapper().valueToTree("message"));
        assertThat(schemas.at("/StoneChatMessageRequest/properties/conversationId/format").asText()).isEqualTo("uuid");
        assertThat(schemas.at("/StoneChatMessageRequest/properties/message/maxLength").asInt()).isEqualTo(2000);
        assertThat(schemas.at("/StoneChatContext/properties/stoneId/maximum").asLong()).isEqualTo(9007199254740991L);
        assertThat(schemas.at("/StoneChatContext/properties/stoneId/minimum").asLong()).isEqualTo(1);
        assertThat(schemas.at("/StoneChatMessageResponse/properties").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactlyInAnyOrder("text", "stones");
        assertThat(schemas.at("/StoneChatMessageResponse/properties/stones/items/$ref").asText())
                .isEqualTo("#/components/schemas/StoneChatStone");
        assertThat(schemas.at("/StoneChatStone/properties").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactlyInAnyOrder("id", "name");
        assertThat(Yaml31.mapper().readTree(restClient.get().uri("/v3/api-docs.yaml").exchange()
                .expectStatus().isOk().expectBody(String.class).returnResult().getResponseBody())).isEqualTo(openApi);
    }

    private static HashMap<String, Object> validRequest() {
        return new HashMap<>(Map.of("conversationId", UUID.randomUUID().toString(), "message", "  Choose a stone  "));
    }
}
