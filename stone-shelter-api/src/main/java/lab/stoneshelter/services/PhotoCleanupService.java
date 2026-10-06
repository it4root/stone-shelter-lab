package lab.stoneshelter.services;

import java.time.Instant;
import java.util.List;
import lab.stoneshelter.entities.PhotoCleanupEntity;
import lab.stoneshelter.repositories.PhotoCleanupEntityRepository;
import lab.stoneshelter.repositories.StonePhotoEntityRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PhotoCleanupService {
    private final PhotoCleanupEntityRepository cleanupRepository;
    private final StonePhotoEntityRepository photoRepository;
    private final MinioPhotoStorageService storage;

    public PhotoCleanupService(PhotoCleanupEntityRepository cleanupRepository,
            StonePhotoEntityRepository photoRepository, MinioPhotoStorageService storage) {
        this.cleanupRepository = cleanupRepository;
        this.photoRepository = photoRepository;
        this.storage = storage;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordUploadIntent(String objectKey) {
        enqueue(objectKey, Instant.now().plusSeconds(86400));
    }

    public void enqueueDeletedPhotos(List<String> objectKeys) {
        objectKeys.forEach(objectKey -> enqueue(objectKey, Instant.now()));
    }

    public void lockUploadIntent(String objectKey) {
        cleanupRepository.findByObjectKeyForUpdate(objectKey).orElseThrow();
    }

    public void completeUpload(String objectKey) {
        cleanupRepository.deleteById(objectKey);
    }

    @Transactional(readOnly = true, timeout = 10)
    public List<String> findDueKeys(int limit) {
        return cleanupRepository.findByAvailableAtBeforeOrderByAvailableAtAsc(Instant.now(), PageRequest.of(0, limit))
                .stream().map(PhotoCleanupEntity::getObjectKey).toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 10)
    public void clean(String objectKey) {
        var photoCleanupEntity = cleanupRepository.findByObjectKeyForUpdate(objectKey).orElse(null);
        if (photoCleanupEntity == null || photoCleanupEntity.getAvailableAt().isAfter(Instant.now())) return;
        if (photoRepository.existsByObjectKey(objectKey)) {
            // A durable stale intent must never remove a successfully attached object.
            cleanupRepository.delete(photoCleanupEntity);
            return;
        }
        storage.remove(objectKey);
        cleanupRepository.delete(photoCleanupEntity);
    }

    private void enqueue(String objectKey, Instant availableAt) {
        var photoCleanupEntity = new PhotoCleanupEntity();
        photoCleanupEntity.setObjectKey(objectKey);
        photoCleanupEntity.setAvailableAt(availableAt);
        cleanupRepository.save(photoCleanupEntity);
    }
}
