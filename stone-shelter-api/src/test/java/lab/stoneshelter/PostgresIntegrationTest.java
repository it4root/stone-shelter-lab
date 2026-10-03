package lab.stoneshelter;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.postgresql.PostgreSQLContainer;

abstract class PostgresIntegrationTest {
    @ServiceConnection
    private static final PostgreSQLContainer DATABASE = new PostgreSQLContainer("postgres:18.6");

    static {
        // JVM-wide lifecycle: JUnit must not stop it after an individual test class.
        // Testcontainers' Ryuk cleans up the container when the test JVM exits.
        DATABASE.start();
    }

}
