package lab.stoneshelter.services;

import java.time.Instant;
import java.util.List;
import lab.stoneshelter.entities.PhotoCleanupEntity;
import lab.stoneshelter.exceptions.PhotoStorageUnavailableException;
import lab.stoneshelter.repositories.PhotoCleanupEntityRepository;
import lab.stoneshelter.repositories.StonePhotoEntityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

@Service
@Transactional
public class PhotoCleanupService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PhotoCleanupService.class);
    private final PhotoCleanupEntityRepository cleanupRepository;
    private final StonePhotoEntityRepository photoRepository;
    private final MinioPhotoStorageService storage;
    private final TransactionTemplate cleanupTransaction;

    public PhotoCleanupService(PhotoCleanupEntityRepository cleanupRepository,
            StonePhotoEntityRepository photoRepository, MinioPhotoStorageService storage,
            PlatformTransactionManager transactionManager) {
        this.cleanupRepository = cleanupRepository;
        this.photoRepository = photoRepository;
        this.storage = storage;
        cleanupTransaction = new TransactionTemplate(transactionManager);
        cleanupTransaction.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
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

    @Transactional(readOnly = true)
    public List<String> findDueKeys() {
        return cleanupRepository.findByAvailableAtBeforeOrderByAvailableAtAsc(Instant.now(), PageRequest.of(0, 100))
                .stream().map(PhotoCleanupEntity::getObjectKey).toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void clean(String objectKey) {
        var photoCleanupEntity = cleanupRepository.findByObjectKeyForUpdate(objectKey).orElse(null);
        if (photoCleanupEntity == null) return;
        if (photoRepository.existsByObjectKey(objectKey)) {
            // A durable stale intent must never remove a successfully attached object.
            cleanupRepository.delete(photoCleanupEntity);
            return;
        }
        try {
            storage.remove(objectKey);
            cleanupRepository.delete(photoCleanupEntity);
        } catch (PhotoStorageUnavailableException exception) {
            photoCleanupEntity.setAvailableAt(Instant.now().plusSeconds(60));
            LOGGER.warn("Managed photo cleanup deferred for {}", objectKey);
        }
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void attemptCleanup(String objectKey) {
        try {
            cleanupTransaction.executeWithoutResult(transactionStatus -> clean(objectKey));
        } catch (RuntimeException exception) {
            LOGGER.warn("Managed photo cleanup could not run for {}; durable intent retained", objectKey);
        }
    }

    private void enqueue(String objectKey, Instant availableAt) {
        var photoCleanupEntity = new PhotoCleanupEntity();
        photoCleanupEntity.setObjectKey(objectKey);
        photoCleanupEntity.setAvailableAt(availableAt);
        cleanupRepository.save(photoCleanupEntity);
    }
}
