package lab.stoneshelter.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lab.stoneshelter.shared.StoneChatMessageRequest;
import lab.stoneshelter.shared.StoneChatMessageResponse;
import lab.stoneshelter.shared.StoneChatStone;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat/messages")
public class StoneChatbotController {
    @Operation(summary = "Send a message to the demo stone chatbot",
            description = "Stub: every valid request returns a fixed answer. No AI, catalog lookup or server conversation storage. Demo references may not exist in the real catalog.")
    @ApiResponse(responseCode = "200", description = "Fixed demo response.",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = StoneChatMessageResponse.class)))
    @ApiResponse(responseCode = "400", description = "Invalid UUID, message or page context.",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @PostMapping(consumes = "application/json", produces = "application/json")
    public StoneChatMessageResponse sendMessage(@Valid @RequestBody StoneChatMessageRequest stoneChatMessageRequest) {
        // Feature 0012 explicitly permits constructing this fixed stub response here.
        return new StoneChatMessageResponse("Here are some stones you might like.",
                List.of(new StoneChatStone(1, "Mars"), new StoneChatStone(3, "Luna")));
    }
}
