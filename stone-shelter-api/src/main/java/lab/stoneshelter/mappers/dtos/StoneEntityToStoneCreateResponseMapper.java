package lab.stoneshelter.mappers.dtos;

import lab.stoneshelter.entities.StoneEntity;
import lab.stoneshelter.shared.StoneCreateResponse;
import org.springframework.stereotype.Component;

@Component
public final class StoneEntityToStoneCreateResponseMapper extends AbstractDtoMapper<StoneEntity, StoneCreateResponse> {

    @Override
    protected StoneCreateResponse mapToDto(StoneEntity entity) {
        var dto = new StoneCreateResponse();
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
