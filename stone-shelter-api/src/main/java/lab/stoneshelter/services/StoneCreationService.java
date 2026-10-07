package lab.stoneshelter.services;

import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.Comparator;
import lab.stoneshelter.entities.StonePhotoDraftEntity;
import lab.stoneshelter.exceptions.InvalidStonePhotoDraftException;
import lab.stoneshelter.exceptions.StonePhotoDraftConflictException;
import lab.stoneshelter.exceptions.StoneNotFoundException;
import lab.stoneshelter.mappers.entities.StoneCreateRequestToStoneEntityMapper;
import lab.stoneshelter.mappers.entities.StonePhotoDraftEntityToStonePhotoEntityMapper;
import lab.stoneshelter.mappers.dtos.StoneEntityToStoneCreateResponseMapper;
import lab.stoneshelter.repositories.StoneEntityRepository;
import lab.stoneshelter.repositories.StonePhotoDraftEntityRepository;
import lab.stoneshelter.repositories.StonePhotoEntityRepository;
import lab.stoneshelter.shared.StoneCreateRequest;
import lab.stoneshelter.shared.StoneCreateResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StoneCreationService {
    private final StoneEntityRepository repository;
    private final StonePhotoDraftEntityRepository draftRepository;
    private final StonePhotoEntityRepository photoRepository;
    private final StoneCreateRequestToStoneEntityMapper requestMapper;
    private final StonePhotoDraftEntityToStonePhotoEntityMapper photoMapper;
    private final StoneEntityToStoneCreateResponseMapper responseMapper;
    private final Clock clock;

    public StoneCreationService(StoneEntityRepository repository, StonePhotoDraftEntityRepository draftRepository,
            StonePhotoEntityRepository photoRepository, StoneCreateRequestToStoneEntityMapper requestMapper,
            StonePhotoDraftEntityToStonePhotoEntityMapper photoMapper, StoneEntityToStoneCreateResponseMapper responseMapper, Clock clock) {
        this.repository = repository;
        this.draftRepository = draftRepository;
        this.photoRepository = photoRepository;
        this.requestMapper = requestMapper;
        this.photoMapper = photoMapper;
        this.responseMapper = responseMapper;
        this.clock = clock;
    }

    public long create(StoneCreateRequest request) {
        List<UUID> photoUploadIds = request.getPhotoUploadIds() == null ? List.of() : request.getPhotoUploadIds();
        if (new HashSet<>(photoUploadIds).size() != photoUploadIds.size()) throw new InvalidStonePhotoDraftException();
        var stonePhotoDraftEntities = new HashMap<UUID, StonePhotoDraftEntity>();
        for (UUID id : photoUploadIds.stream().sorted(Comparator.comparing(UUID::toString)).toList()) {
            stonePhotoDraftEntities.put(id, draftRepository.findByIdForUpdate(id).orElseThrow(InvalidStonePhotoDraftException::new));
        }
        Instant now = Instant.now(clock);
        for (var stonePhotoDraftEntity : stonePhotoDraftEntities.values()) {
            if (stonePhotoDraftEntity.getStone() != null) throw new StonePhotoDraftConflictException();
            if (!stonePhotoDraftEntity.getExpiresAt().isAfter(now)) throw new InvalidStonePhotoDraftException();
        }
        var stoneEntity = repository.saveAndFlush(requestMapper.toEntity(request));
        for (UUID id : photoUploadIds) {
            var stonePhotoDraftEntity = stonePhotoDraftEntities.get(id);
            stonePhotoDraftEntity.setStone(stoneEntity);
            stoneEntity.getPhotos().add(photoRepository.save(photoMapper.toEntity(stonePhotoDraftEntity)));
        }
        return stoneEntity.getId();
    }

    @Transactional(readOnly = true)
    public StoneCreateResponse findById(long id) {
        return responseMapper.toDto(repository.findById(id).orElseThrow(() -> new StoneNotFoundException(id)));
    }
}
