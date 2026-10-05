package lab.stoneshelter.controllers;

import jakarta.validation.Valid;
import lab.stoneshelter.services.StoneService;
import lab.stoneshelter.shared.StoneCreateRequest;
import lab.stoneshelter.shared.StoneCreateResponse;
import lab.stoneshelter.shared.StoneDeleteResponse;
import lab.stoneshelter.shared.StoneResponse;
import lab.stoneshelter.shared.StoneUpdateRequest;
import lab.stoneshelter.shared.StoneUpdateResponse;
import lab.stoneshelter.shared.StonesSearchRequest;
import lab.stoneshelter.shared.StonesSearchResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/v1/stones")
public class StoneCatalogController {
    private final StoneService service;

    public StoneCatalogController(StoneService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StoneCreateResponse createStone(
            @Valid @RequestBody StoneCreateRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public StoneResponse getStone(@PathVariable("id") Long id) {
        return service.get(id);
    }

    @PostMapping("/search")
    public StonesSearchResponse searchStones(
            @Valid @RequestBody StonesSearchRequest request) {
        return service.search(request);
    }

    @PutMapping("/{id}")
    public StoneUpdateResponse updateStone(
            @PathVariable("id") Long id,
            @Valid @RequestBody StoneUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public StoneDeleteResponse deleteStone(@PathVariable("id") Long id) {
        return service.delete(id);
    }
}
