package lab.stoneshelter.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "photo_cleanup")
public class PhotoCleanupEntity {
    @Id @Column(name = "object_key", length = 500)
    private String objectKey;
    @Column(name = "available_at", nullable = false)
    private Instant availableAt;

    public PhotoCleanupEntity() {}
    public String getObjectKey() { return objectKey; }
    public void setObjectKey(String objectKey) { this.objectKey = objectKey; }
    public Instant getAvailableAt() { return availableAt; }
    public void setAvailableAt(Instant availableAt) { this.availableAt = availableAt; }
}
