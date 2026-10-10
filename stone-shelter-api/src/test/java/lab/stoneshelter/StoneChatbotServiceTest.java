package lab.stoneshelter;

import java.util.List;
import java.util.UUID;
import lab.stoneshelter.entities.StoneChatConversationEntity;
import lab.stoneshelter.entities.StoneChatTurnEntity;
import lab.stoneshelter.entities.StoneChatStoneEntity;
import lab.stoneshelter.exceptions.StoneChatUnavailableException;
import lab.stoneshelter.mappers.dtos.StoneChatConversationEntityToStoneChatHistoryResponseMapper;
import lab.stoneshelter.mappers.dtos.StoneChatTurnEntityToStoneChatMessageResponseMapper;
import lab.stoneshelter.mappers.entities.StoneChatMessageRequestToStoneChatTurnEntityMapper;
import lab.stoneshelter.repositories.StoneChatConversationRepository;
import lab.stoneshelter.services.StoneChatAdmissionService;
import lab.stoneshelter.services.StoneChatAvailabilityService;
import lab.stoneshelter.services.StoneChatbotService;
import lab.stoneshelter.services.StoneChatContextSelector;
import lab.stoneshelter.services.StoneChatConversationSerializationService;
import lab.stoneshelter.shared.StoneChatMessageRequest;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StoneChatbotServiceTest {
    @Test void committedReplayUsesMapperAndNeverAcquiresProcessingPermitOrRefreshesCookie() {
        StoneChatConversationRepository history = mock(StoneChatConversationRepository.class);
        StoneChatConversationSerializationService serialization = mock(StoneChatConversationSerializationService.class);
        StoneChatAdmissionService admission = mock(StoneChatAdmissionService.class);
        StoneChatAvailabilityService availability = mock(StoneChatAvailabilityService.class);
        when(availability.execute(any())).thenAnswer(invocation -> invocation.<java.util.function.Supplier<?>>getArgument(0).get());
        StoneChatMessageRequest request = new StoneChatMessageRequest(UUID.randomUUID(), UUID.randomUUID(), "exact", null);
        StoneChatTurnEntity turn = new StoneChatMessageRequestToStoneChatTurnEntityMapper().toEntity(request);
        turn.setText("Here are some stones you might like."); turn.setStones(List.of(new StoneChatStoneEntity(1, "Mars"), new StoneChatStoneEntity(3, "Luna")));
        when(history.findById(anyString(), any())).thenReturn(new StoneChatConversationEntity(1, request.conversationId(), List.of(turn)));
        when(history.findCommitted(any(), any())).thenReturn(turn);
        Runnable committed = mock(Runnable.class);
        StoneChatbotService service = new StoneChatbotService(history, serialization, admission, availability,
                new StoneChatMessageRequestToStoneChatTurnEntityMapper(), new StoneChatTurnEntityToStoneChatMessageResponseMapper(),
                new StoneChatConversationEntityToStoneChatHistoryResponseMapper(), new StoneChatContextSelector());
        assertThat(service.sendMessage(request, "session", committed).stones()).hasSize(2);
        verify(serialization, never()).acquire(anyString(), any()); verify(committed, never()).run();
        when(history.findCommitted(any(), any())).thenReturn(null);
        var guard = mock(StoneChatConversationSerializationService.Guard.class);
        when(serialization.acquire(anyString(), any())).thenReturn(guard); when(guard.token()).thenReturn("token");
        when(history.append(anyString(), any(), anyString(), any())).thenThrow(new StoneChatUnavailableException());
        assertThatThrownBy(() -> service.sendMessage(request, "session", committed)).isInstanceOf(StoneChatUnavailableException.class);
        verify(guard, times(1)).close(); verify(committed, never()).run();
        doThrow(new StoneChatUnavailableException()).when(admission).authorize("session", request.conversationId(), true);
        assertThatThrownBy(() -> service.sendMessage(request, "session", committed)).isInstanceOf(StoneChatUnavailableException.class);
        org.mockito.Mockito.doNothing().when(admission).authorize("session", request.conversationId(), true);
        doAnswer(invocation -> invocation.getArgument(3)).when(history).append(anyString(), any(), anyString(), any());
        StoneChatMessageRequest newRequest = new StoneChatMessageRequest(request.conversationId(), UUID.randomUUID(), "new turn", null);
        assertThat(service.sendMessage(newRequest, "session", committed).text()).isEqualTo("Here are some stones you might like.");
        verify(committed, times(1)).run();
    }
}
