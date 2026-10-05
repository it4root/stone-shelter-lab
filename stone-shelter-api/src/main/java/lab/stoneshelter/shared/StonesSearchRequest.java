package lab.stoneshelter.shared;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public record StonesSearchRequest(
    @Valid StoneSearchFilter filter,
    @Min(0) Integer page,
    @Min(1) @Max(24) Integer size,
    @Valid SearchSort sort
) {}
