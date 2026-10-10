package lab.stoneshelter.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.ProblemDetail;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lab.stoneshelter.services.StoneChatAdmissionService;
import lab.stoneshelter.services.StoneChatbotService;
import lab.stoneshelter.shared.StoneChatMessageRequest;
import lab.stoneshelter.shared.StoneChatMessageResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SecurityScheme(name = "stoneChatSession", type = SecuritySchemeType.APIKEY, in = SecuritySchemeIn.COOKIE,
        paramName = "stone_chat_session", description = "Server-issued HttpOnly host-only cookie. A healthy admitted request may allocate a fresh session; retained conversation UUIDs cannot transfer to it.")
@RestController
@RequestMapping("/api/v1/chat/messages")
public class StoneChatbotController {
    private final StoneChatbotService chatbot;
    private final StoneChatAdmissionService admission;
    public StoneChatbotController(StoneChatbotService chatbot, StoneChatAdmissionService admission) { this.chatbot = chatbot; this.admission = admission; }
    @SecurityRequirement(name = "stoneChatSession")
    @Parameter(name = "Origin", in = ParameterIn.HEADER, required = true, description = "Exact configured browser frontend origin; missing/null/foreign is rejected.", schema = @Schema(type = "string"))
    @Operation(summary = "Send a persisted demo chat turn", description = "Cookie-bound Redis conversation history. Required allowed POST Origin and retry turnId. No AI or catalog lookup; demo references may not exist. Only newly committed turns refresh retention; replay does not.")
    @ApiResponse(responseCode = "200", description = "Confirmed persisted demo response or exact committed replay.", content = @Content(schema = @Schema(implementation = StoneChatMessageResponse.class)))
    @ApiResponse(responseCode = "400", description = "Invalid UUID, required turnId, message or context.", content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "403", description = "CHAT_ORIGIN_REJECTED: missing/null/foreign POST Origin.", content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "CHAT_CONVERSATION_NOT_FOUND: retained UUID is foreign, including lost cookie.", content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "409", description = "CHAT_TURN_CONFLICT: committed turnId payload changed.", content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", headers = @Header(name = "Retry-After", description = "Positive whole seconds until manual retry, rounded up; conversation-busy hint is 1.", schema = @Schema(type = "integer", minimum = "1")), description = "CHAT_RATE_LIMITED or CHAT_CONVERSATION_BUSY; Retry-After is positive seconds, busy hint 1.", content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "503", description = "CHAT_UNAVAILABLE: required dependency unavailable or outcome unknown; manual history recovery required.", content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @PostMapping(consumes = "application/json", produces = "application/json")
    public StoneChatMessageResponse sendMessage(@Valid @RequestBody StoneChatMessageRequest request,
            @RequestAttribute(StoneChatBindingInterceptor.SESSION) String sessionId,
            HttpServletRequest httpRequest, HttpServletResponse response) {
        return chatbot.sendMessage(request, sessionId, () -> StoneChatBindingInterceptor.writeCookie(response, httpRequest, sessionId, admission.retentionSeconds()));
    }
}
