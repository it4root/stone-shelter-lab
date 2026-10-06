package lab.stoneshelter.services;

import java.time.ZoneOffset;
import lab.stoneshelter.exceptions.InvalidAdmissionDateRangeException;
import lab.stoneshelter.enums.StoneSortField;
import lab.stoneshelter.criteria.StoneSearchCriteria;
import lab.stoneshelter.exceptions.StoneNotFoundException;
import lab.stoneshelter.repositories.StoneEntityRepository;

import lab.stoneshelter.shared.StoneCreateRequest;
import lab.stoneshelter.shared.StoneCreateResponse;
import lab.stoneshelter.shared.StoneDeleteResponse;
import lab.stoneshelter.shared.StoneResponse;
import lab.stoneshelter.shared.StoneUpdateRequest;
import lab.stoneshelter.shared.StoneUpdateResponse;
import lab.stoneshelter.shared.StonesSearchRequest;
import lab.stoneshelter.shared.StonesSearchResponse;
import lab.stoneshelter.entities.StoneEntity;
import lab.stoneshelter.mappers.entities.StoneCreateRequestToStoneEntityMapper;
import lab.stoneshelter.mappers.entities.StoneUpdateRequestToStoneEntityMapper;
import lab.stoneshelter.mappers.dtos.StoneEntityToStoneCreateResponseMapper;
import lab.stoneshelter.mappers.dtos.StoneEntityToStoneResponseMapper;
import lab.stoneshelter.mappers.dtos.StoneEntityToStoneUpdateResponseMapper;
import lab.stoneshelter.mappers.dtos.PageToStonesSearchResponseMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StoneService {
    private final StoneEntityRepository repository;
    private final StoneCreateRequestToStoneEntityMapper createRequestMapper;
    private final StoneUpdateRequestToStoneEntityMapper updateRequestMapper;
    private final StoneEntityToStoneCreateResponseMapper createResponseMapper;
    private final StoneEntityToStoneResponseMapper responseMapper;
    private final StoneEntityToStoneUpdateResponseMapper updateResponseMapper;
    private final PageToStonesSearchResponseMapper searchResponseMapper;

    public StoneService(StoneEntityRepository repository,
            StoneCreateRequestToStoneEntityMapper createRequestMapper,
            StoneUpdateRequestToStoneEntityMapper updateRequestMapper,
            StoneEntityToStoneCreateResponseMapper createResponseMapper,
            StoneEntityToStoneResponseMapper responseMapper,
            StoneEntityToStoneUpdateResponseMapper updateResponseMapper,
            PageToStonesSearchResponseMapper searchResponseMapper) {
        this.repository = repository;
        this.createRequestMapper = createRequestMapper;
        this.updateRequestMapper = updateRequestMapper;
        this.createResponseMapper = createResponseMapper;
        this.responseMapper = responseMapper;
        this.updateResponseMapper = updateResponseMapper;
        this.searchResponseMapper = searchResponseMapper;
    }

    public StoneCreateResponse create(StoneCreateRequest request) {
        return createResponseMapper.toDto(repository.save(createRequestMapper.toEntity(request)));
    }

    @Transactional(readOnly = true)
    public StoneResponse get(long id) {
        return responseMapper.toDto(findById(id));
    }

    public StoneUpdateResponse update(long id, StoneUpdateRequest request) {
        return updateResponseMapper.toDto(updateRequestMapper.toEntity(findById(id), request));
    }

    public StoneDeleteResponse delete(long id) {
        repository.delete(findById(id));
        return new StoneDeleteResponse(id);
    }

    @Transactional(readOnly = true)
    public StonesSearchResponse search(StonesSearchRequest request) {
        return searchResponseMapper.toDto(repository.search(prepareSearchCriteria(request)));
    }

    private StoneSearchCriteria prepareSearchCriteria(StonesSearchRequest request) {
        var filter = request.filter();
        if (filter != null && filter.getAdmissionDateFrom() != null && filter.getAdmissionDateTo() != null
                && filter.getAdmissionDateFrom().isAfter(filter.getAdmissionDateTo())) {
            throw new InvalidAdmissionDateRangeException();
        }
        var sort = request.sort();
        var field = sort == null || sort.field() == null
                ? StoneSortField.ADMISSION_DATE
                : StoneSortField.fromValue(sort.field());

        var stoneSearchCriteria = new StoneSearchCriteria();
        stoneSearchCriteria.setStoneType(filter == null ? null : filter.getStoneType());
        stoneSearchCriteria.setStoneSize(filter == null ? null : filter.getStoneSize());
        stoneSearchCriteria.setAdoptionStatus(filter == null ? null : filter.getAdoptionStatus());
        stoneSearchCriteria.setStoneSizes(filter == null ? null : filter.getStoneSizes());
        stoneSearchCriteria.setStoneTypes(filter == null ? null : filter.getStoneTypes());
        stoneSearchCriteria.setAdmissionDateFrom(filter == null || filter.getAdmissionDateFrom() == null ? null
                : filter.getAdmissionDateFrom().atStartOfDay().toInstant(ZoneOffset.UTC));
        stoneSearchCriteria.setAdmissionDateToExclusive(filter == null || filter.getAdmissionDateTo() == null ? null
                : filter.getAdmissionDateTo().plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC));
        stoneSearchCriteria.setPage(request.page() == null ? 0 : request.page());
        stoneSearchCriteria.setSize(request.size() == null ? 12 : request.size());
        stoneSearchCriteria.setField(field);
        stoneSearchCriteria.setDescending(sort == null || sort.direction() == null
                ? field == StoneSortField.ADMISSION_DATE
                : "desc".equals(sort.direction()));
        return stoneSearchCriteria;
    }

    private StoneEntity findById(long id) {
        return repository.findById(id).orElseThrow(() -> new StoneNotFoundException(id));
    }

}
