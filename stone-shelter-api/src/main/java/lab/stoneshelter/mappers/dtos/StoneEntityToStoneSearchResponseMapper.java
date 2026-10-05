package lab.stoneshelter.mappers.dtos;

import lab.stoneshelter.entities.StoneEntity;
import lab.stoneshelter.shared.StoneSearchResponse;
import org.springframework.stereotype.Component;

@Component
public final class StoneEntityToStoneSearchResponseMapper extends AbstractDtoMapper<StoneEntity, StoneSearchResponse> {

    @Override
    protected StoneSearchResponse mapToDto(StoneEntity entity) {
        var dto = new StoneSearchResponse();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setPhoto(entity.getPhoto());
        dto.setStoneType(entity.getStoneType());
        dto.setBiography(entity.getBiography());
        dto.setAdoptionStatus(entity.getAdoptionStatus());
        dto.setAdmissionDate(entity.getAdmissionDate());
        dto.setStoneSize(entity.getStoneSize());
        return dto;
    }
}
