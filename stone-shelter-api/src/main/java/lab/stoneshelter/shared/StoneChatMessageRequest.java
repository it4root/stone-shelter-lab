package lab.stoneshelter.shared;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

@Schema(description = "A new chat message; history stays in the UI during the stub phase.")
public record StoneChatMessageRequest(
        @NotNull @Schema(description = "Client conversation UUID; correlation only, not authentication.",
                requiredMode = Schema.RequiredMode.REQUIRED) UUID conversationId,
        @NotBlank @Size(max = 2000) @Schema(description = "Nonblank message, preserved without normalization.",
                requiredMode = Schema.RequiredMode.REQUIRED) String message,
        @Valid @Schema(description = "Optional page context captured at submission time.", nullable = true)
        StoneChatContext context) {}
