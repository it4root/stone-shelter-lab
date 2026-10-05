package lab.stoneshelter.shared;

import jakarta.validation.constraints.Pattern;

public record SearchSort(
    @Pattern(regexp = "name|stoneSize") String field,
    @Pattern(regexp = "asc|desc") String direction
) {}
