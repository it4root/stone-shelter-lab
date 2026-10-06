package lab.stoneshelter.repositories;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lab.stoneshelter.entities.PhotoCleanupEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhotoCleanupEntityRepository extends JpaRepository<PhotoCleanupEntity, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from PhotoCleanupEntity c where c.objectKey = :objectKey")
    Optional<PhotoCleanupEntity> findByObjectKeyForUpdate(@Param("objectKey") String objectKey);
    List<PhotoCleanupEntity> findByAvailableAtBeforeOrderByAvailableAtAsc(Instant instant, Pageable pageable);
}
