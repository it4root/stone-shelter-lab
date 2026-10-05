package lab.stoneshelter.shared;

import java.util.List;

public record StonesSearchResponse(
    List<StoneSearchResponse> content,
    int page,
    int size,
    long totalElements
) {}
