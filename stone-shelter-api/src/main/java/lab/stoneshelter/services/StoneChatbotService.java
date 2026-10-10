package lab.stoneshelter.services;

import java.util.UUID;
import java.util.List;
import lab.stoneshelter.entities.StoneChatStoneEntity;
import lab.stoneshelter.exceptions.StoneChatUnavailableException;
import lab.stoneshelter.entities.StoneChatTurnEntity;
import lab.stoneshelter.mappers.dtos.StoneChatConversationEntityToStoneChatHistoryResponseMapper;
import lab.stoneshelter.mappers.dtos.StoneChatTurnEntityToStoneChatMessageResponseMapper;
import lab.stoneshelter.mappers.entities.StoneChatMessageRequestToStoneChatTurnEntityMapper;
import lab.stoneshelter.repositories.StoneChatConversationRepository;
import lab.stoneshelter.shared.StoneChatHistoryResponse;
import lab.stoneshelter.shared.StoneChatMessageRequest;
import lab.stoneshelter.shared.StoneChatMessageResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StoneChatbotService {
    private record Components(StoneChatConversationRepository history, StoneChatConversationSerializationService serialization,
                              StoneChatAdmissionService admission, StoneChatAvailabilityService availability) {}
    private record Mapping(StoneChatMessageRequestToStoneChatTurnEntityMapper request, StoneChatTurnEntityToStoneChatMessageResponseMapper response,
                           StoneChatConversationEntityToStoneChatHistoryResponseMapper history, StoneChatContextSelector context) {}
    private final Components components;
    private final Mapping mapping;
    public StoneChatbotService(StoneChatConversationRepository history, StoneChatConversationSerializationService serialization,
            StoneChatAdmissionService admission, StoneChatAvailabilityService availability, StoneChatMessageRequestToStoneChatTurnEntityMapper requestMapper,
            StoneChatTurnEntityToStoneChatMessageResponseMapper responseMapper, StoneChatConversationEntityToStoneChatHistoryResponseMapper historyMapper,
            StoneChatContextSelector contextSelector) {
        components = new Components(history, serialization, admission, availability);
        mapping = new Mapping(requestMapper, responseMapper, historyMapper, contextSelector);
    }
    public StoneChatMessageResponse sendMessage(StoneChatMessageRequest request, String sessionId, Runnable onCommitted) {
        return components.availability().execute(() -> {
            components.admission().authorize(sessionId, request.conversationId(), true);
            StoneChatTurnEntity turn = mapping.request().toEntity(request);
            StoneChatTurnEntity replay = components.history().findCommitted(components.history().findById(sessionId, request.conversationId()), turn);
            if (replay != null) { components.availability().assertReady(); return mapping.response().toDto(replay); }
            StoneChatTurnEntity committed;
            try (var guard = components.serialization().acquire(sessionId, request.conversationId())) {
                components.availability().assertReady();
                var conversation = components.history().findById(sessionId, request.conversationId());
                StoneChatTurnEntity racedReplay = components.history().findCommitted(conversation, turn);
                if (racedReplay != null) return mapping.response().toDto(racedReplay);
                if (mapping.context().select(conversation.turns()) == null) throw new StoneChatUnavailableException();
                guard.check(); components.availability().assertReady();
                committed = components.history().append(sessionId, request.conversationId(), guard.token(), completeDemoTurn(turn));
                guard.check(); components.availability().assertReady();
            }
            components.availability().assertReady(); onCommitted.run(); return mapping.response().toDto(committed);
        });
    }
    private StoneChatTurnEntity completeDemoTurn(StoneChatTurnEntity turn) {
        turn.setText("Here are some stones you might like.");
        turn.setStones(List.of(new StoneChatStoneEntity(1, "Mars"), new StoneChatStoneEntity(3, "Luna"))); return turn;
    }
    @Transactional(readOnly = true)
    public StoneChatHistoryResponse findById(UUID conversationId, String sessionId) {
        return components.availability().execute(() -> {
            components.admission().authorize(sessionId, conversationId, false);
            StoneChatHistoryResponse response = mapping.history().toDto(components.history().findById(sessionId, conversationId));
            components.availability().assertReady(); return response;
        });
    }
}
