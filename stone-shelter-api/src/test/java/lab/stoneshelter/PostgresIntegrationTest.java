package lab.stoneshelter;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

abstract class PostgresIntegrationTest {
    private static final PostgreSQLContainer DATABASE = new PostgreSQLContainer("postgres:18.6");

    static {
        // JVM-wide lifecycle: JUnit must not stop it after an individual test class.
        // Testcontainers' Ryuk cleans up the container when the test JVM exits.
        DATABASE.start();
    }

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DATABASE::getJdbcUrl);
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
    }
}
