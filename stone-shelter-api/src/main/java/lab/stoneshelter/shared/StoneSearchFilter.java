package lab.stoneshelter.shared;

import io.swagger.v3.oas.annotations.media.Schema;
import lab.stoneshelter.enums.AdoptionStatus;
import lab.stoneshelter.enums.StoneSize;
import lab.stoneshelter.enums.StoneType;

@Schema(description = "Optional exact-match filters for a stone search.")
public record StoneSearchFilter(
    @Schema(description = "Stone type.")
    StoneType stoneType,
    @Schema(description = "Stone size.")
    StoneSize stoneSize,
    @Schema(description = "Stone adoption status.")
    AdoptionStatus adoptionStatus
) {}
