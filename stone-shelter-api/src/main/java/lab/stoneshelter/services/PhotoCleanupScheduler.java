package lab.stoneshelter.services;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class PhotoCleanupScheduler {
    private final PhotoCleanupService cleanup;
    public PhotoCleanupScheduler(PhotoCleanupService cleanup) { this.cleanup = cleanup; }

    @Scheduled(fixedDelayString = "${stone.photos.cleanup-delay-ms}", initialDelayString = "${stone.photos.cleanup-delay-ms}")
    public void retryDueObjects() {
        cleanup.findDueKeys().forEach(cleanup::clean);
    }
}
