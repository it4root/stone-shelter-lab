package lab.stoneshelter;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.core.util.Json31;
import io.swagger.v3.core.util.Yaml31;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class OpenApiDocumentationTest extends IntegrationTest {
    @Autowired
    private RestTestClient restClient;

    @Test
    void documentsOnlyCatalogOperationsWithTheirSuccessfulStatusesAndDtos() throws Exception {
        JsonNode jsonNode = openApiJson();
        assertThat(jsonNode.path("openapi").asText()).startsWith("3.");
        JsonNode pathsJsonNode = jsonNode.path("paths");
        assertThat(pathsJsonNode.propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactlyInAnyOrder("/api/v1/stones", "/api/v1/stones/{id}", "/api/v1/stones/search");
        assertThat(pathsJsonNode.path("/api/v1/stones").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactly("post");
        assertThat(pathsJsonNode.path("/api/v1/stones/{id}").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactlyInAnyOrder("get", "put", "delete");
        assertThat(pathsJsonNode.path("/api/v1/stones/search").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactly("post");
        assertOperation(pathsJsonNode.path("/api/v1/stones").path("post"), "201", "StoneCreateResponse");
        assertOperation(pathsJsonNode.path("/api/v1/stones/{id}").path("get"), "200", "StoneResponse");
        assertOperation(pathsJsonNode.path("/api/v1/stones/{id}").path("put"), "200", "StoneUpdateResponse");
        assertOperation(pathsJsonNode.path("/api/v1/stones/{id}").path("delete"), "200", "StoneDeleteResponse");
        assertOperation(pathsJsonNode.path("/api/v1/stones/search").path("post"), "200", "StonesSearchResponse");
        assertThat(pathsJsonNode.path("/api/v1/stones").path("post")
                .at("/requestBody/content/application~1json/schema/$ref").asText())
                .isEqualTo("#/components/schemas/StoneCreateRequest");
        assertThat(pathsJsonNode.path("/api/v1/stones/{id}").path("put")
                .at("/requestBody/content/application~1json/schema/$ref").asText())
                .isEqualTo("#/components/schemas/StoneUpdateRequest");
        assertThat(pathsJsonNode.path("/api/v1/stones/search").path("post")
                .at("/requestBody/content/application~1json/schema/$ref").asText())
                .isEqualTo("#/components/schemas/StonesSearchRequest");
    }

    @Test
    void describesEveryDtoAndPropertyAndRetainsSupportedValidationConstraints() throws Exception {
        JsonNode schemasJsonNode = openApiJson().at("/components/schemas");
        for (String name : List.of("StoneCreateRequest", "StoneUpdateRequest", "StoneCreateResponse",
                "StoneUpdateResponse", "StoneResponse", "StoneDeleteResponse", "StoneSearchResponse",
                "StonesSearchRequest", "StonesSearchResponse", "StoneSearchFilter", "SearchSort")) {
            JsonNode schemaJsonNode = schemasJsonNode.path(name);
            assertThat(schemaJsonNode.path("description").asText()).as(name + " description").isNotBlank();
            assertThat(schemaJsonNode.path("properties").size()).as(name + " properties").isPositive();
            schemaJsonNode.path("properties").propertyStream().forEach(entry ->
                    assertThat(entry.getValue().path("description").asText())
                            .as(name + "." + entry.getKey() + " description").isNotBlank());
        }
        for (String name : List.of("StoneCreateRequest", "StoneUpdateRequest")) {
            JsonNode schemaJsonNode = schemasJsonNode.path(name);
            assertThat(schemaJsonNode.path("required")).contains(
                    Json31.mapper().valueToTree("name"), Json31.mapper().valueToTree("stoneType"),
                    Json31.mapper().valueToTree("stoneSize"), Json31.mapper().valueToTree("adoptionStatus"),
                    Json31.mapper().valueToTree("admissionDate"));
            assertThat(schemaJsonNode.at("/properties/name/maxLength").asInt()).isEqualTo(120);
            assertThat(schemaJsonNode.at("/properties/photo/maxLength").asInt()).isEqualTo(500);
            assertThat(schemaJsonNode.at("/properties/biography/maxLength").asInt()).isEqualTo(2048);
            assertThat(schemaJsonNode.at("/properties/admissionDate/format").asText()).isEqualTo("date-time");
        }
        assertThat(schemasJsonNode.at("/StonesSearchRequest/properties/page/minimum").asText()).isEqualTo("0");
        assertThat(schemasJsonNode.at("/StonesSearchRequest/properties/size/minimum").asInt()).isEqualTo(1);
        assertThat(schemasJsonNode.at("/StonesSearchRequest/properties/size/maximum").asInt()).isEqualTo(24);
        assertThat(schemasJsonNode.at("/SearchSort/properties/field/pattern").asText()).isEqualTo("name|stoneSize|admissionDate");
        assertThat(schemasJsonNode.at("/SearchSort/properties/direction/pattern").asText()).isEqualTo("asc|desc");
    }

    @Test
    void servesYamlWithTheSameGeneratedContractAsJson() throws Exception {
        assertThat(Yaml31.mapper().readTree(restClient.get().uri("/v3/api-docs.yaml")
                .exchange().expectStatus().isOk().expectBody(String.class)
                .returnResult().getResponseBody())).isEqualTo(openApiJson());
    }

    @Test
    void servesSwaggerUiAndItsDocumentationConfiguration() {
        restClient.get().uri("/swagger-ui.html").exchange().expectStatus().isFound()
                .expectHeader().valueEquals("Location", "/swagger-ui/index.html");
        restClient.get().uri("/swagger-ui/index.html").exchange().expectStatus().isOk()
                .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_HTML)
                .expectBody(String.class).value(body -> assertThat(body).contains("swagger-ui-bundle.js"));
        restClient.get().uri("/swagger-ui/swagger-ui-bundle.js").exchange().expectStatus().isOk();
        restClient.get().uri("/v3/api-docs/swagger-config").exchange().expectStatus().isOk()
                .expectBody().jsonPath("$.url").isEqualTo("/v3/api-docs");
    }

    private JsonNode openApiJson() throws Exception {
        return Json31.mapper().readTree(restClient.get().uri("/v3/api-docs")
                .exchange().expectStatus().isOk()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)
                .expectBody(String.class).returnResult().getResponseBody());
    }

    private void assertOperation(JsonNode operationJsonNode, String status, String responseType) {
        assertThat(operationJsonNode.path("responses").propertyStream().map(entry -> entry.getKey()).toList())
                .containsExactly(status);
        assertThat(operationJsonNode.path("responses").path(status).path("content").propertyStream()
                .map(entry -> entry.getValue().at("/schema/$ref").asText()).toList())
                .isNotEmpty().containsOnly("#/components/schemas/" + responseType);
    }
}
