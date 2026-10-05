package lab.stoneshelter.shared;

import lab.stoneshelter.enums.AdoptionStatus;
import lab.stoneshelter.enums.StoneSize;
import lab.stoneshelter.enums.StoneType;

public record StoneSearchFilter(
    StoneType stoneType,
    StoneSize stoneSize,
    AdoptionStatus adoptionStatus
) {}
