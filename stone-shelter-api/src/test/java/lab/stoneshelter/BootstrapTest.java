package lab.stoneshelter;

import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
class BootstrapTest extends PostgresIntegrationTest {
    @Autowired
    private RestTestClient restClient;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Test
    void startsWithPostgresLiquibaseJpaAndHealthyActuator() {
        assertThat(entityManagerFactory.isOpen()).isTrue();

        restClient.get().uri("/actuator/health")
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.status").isEqualTo("UP");
    }
}
