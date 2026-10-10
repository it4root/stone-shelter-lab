package lab.stoneshelter.services;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import lab.stoneshelter.exceptions.StoneChatConversationBusyException;
import lab.stoneshelter.exceptions.StoneChatConversationNotFoundException;
import lab.stoneshelter.exceptions.StoneChatOriginRejectedException;
import lab.stoneshelter.exceptions.StoneChatRateLimitedException;
import lab.stoneshelter.exceptions.StoneChatTurnConflictException;
import lab.stoneshelter.exceptions.StoneChatUnavailableException;
import lab.stoneshelter.repositories.StoneChatActiveTurnRepository;
import lab.stoneshelter.repositories.StoneChatConversationRepository;
import lab.stoneshelter.repositories.StoneChatRateLimiterRepository;
import lab.stoneshelter.repositories.StoneChatRedisRepository;
import lab.stoneshelter.repositories.StoneChatSessionRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StoneChatAvailabilityService {
    private record Controls(StoneChatActiveTurnRepository leases, StoneChatContextSelector context) {}
    private record Components(StoneChatSessionRepository sessions, StoneChatConversationRepository history,
                              StoneChatRateLimiterRepository limiter, Controls controls) {}
    private record Status(long generation, boolean ready) {}
    private record Tracking(AtomicReference<Status> status, AtomicBoolean probing) {}
    private final Components components;
    private final StoneChatRedisRepository redis;
    private final StoneChatConversationSerializationService serialization;
    private final Tracking tracking = new Tracking(new AtomicReference<>(new Status(0, false)), new AtomicBoolean());
    public StoneChatAvailabilityService(StoneChatSessionRepository sessions, StoneChatConversationRepository history,
            StoneChatRateLimiterRepository limiter, StoneChatActiveTurnRepository leases,
            StoneChatRedisRepository redis, StoneChatConversationSerializationService serialization, StoneChatContextSelector context) {
        this.components = new Components(sessions, history, limiter, new Controls(leases, context));
        this.redis = redis; this.serialization = serialization;
        redis.setFailureListener(this::invalidate);
    }
    public void invalidate(Throwable failure) {
        tracking.status().updateAndGet(previous -> new Status(previous.generation() + 1, false));
    }
    public void assertReady() { if (!tracking.status().get().ready()) throw new StoneChatUnavailableException(); }
    public <T> T execute(Supplier<T> work) {
        try { return work.get(); }
        catch (StoneChatRateLimitedException | StoneChatConversationBusyException | StoneChatConversationNotFoundException
                | StoneChatOriginRejectedException | StoneChatTurnConflictException exception) { throw exception; }
        catch (RuntimeException exception) { invalidate(exception); throw new StoneChatUnavailableException(exception); }
    }
    @EventListener(ApplicationReadyEvent.class)
    public void initialize() { try { recover(); } catch (StoneChatUnavailableException ignored) { /* Chat readiness is independent of application liveness. */ } }
    public void ensureReady(boolean manualHistoryRecovery) {
        if (!tracking.status().get().ready() && manualHistoryRecovery) recover();
        assertReady();
    }
    public void recover() {
        if (!tracking.probing().compareAndSet(false, true)) throw new StoneChatUnavailableException();
        Status previous = tracking.status().get(); String prefix = "chat:probe:" + UUID.randomUUID() + ":";
        try {
            execute(() -> {
                redis.probe(prefix); components.sessions().probe(prefix); components.history().probe(prefix);
                components.limiter().probe(prefix); components.controls().leases().probe(prefix); serialization.probe();
                if (components.controls().context().select(List.of()) == null)
                    throw new StoneChatUnavailableException();
                return null;
            });
            if (!tracking.status().compareAndSet(previous, new Status(previous.generation(), true)))
                throw new StoneChatUnavailableException();
        } finally { tracking.probing().set(false); }
    }
}
