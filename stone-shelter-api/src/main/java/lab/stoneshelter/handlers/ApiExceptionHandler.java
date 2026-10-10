package lab.stoneshelter.handlers;

import java.net.URI;
import jakarta.servlet.http.HttpServletResponse;
import lab.stoneshelter.exceptions.StoneChatUnavailableException;
import lab.stoneshelter.exceptions.StoneChatRateLimitedException;
import lab.stoneshelter.exceptions.StoneChatConversationBusyException;
import lab.stoneshelter.exceptions.StoneChatConversationNotFoundException;
import lab.stoneshelter.exceptions.StoneChatOriginRejectedException;
import lab.stoneshelter.exceptions.StoneChatTurnConflictException;

import lab.stoneshelter.exceptions.InvalidAdmissionDateRangeException;
import lab.stoneshelter.exceptions.InvalidPhotoException;
import lab.stoneshelter.exceptions.InvalidStonePhotoDraftException;
import lab.stoneshelter.exceptions.StonePhotoDraftConflictException;
import lab.stoneshelter.exceptions.StonePhotoDraftNotFoundException;
import lab.stoneshelter.exceptions.UnsupportedPhotoTypeException;
import lab.stoneshelter.exceptions.PhotoTooLargeException;
import lab.stoneshelter.exceptions.PhotoStorageUnavailableException;
import lab.stoneshelter.exceptions.StoneNotFoundException;
import lab.stoneshelter.exceptions.StoneReservationConflictException;
import lab.stoneshelter.exceptions.MapperValidationException;
import org.springframework.http.HttpHeaders;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    @ExceptionHandler(StoneReservationConflictException.class)
    public ProblemDetail handleReservationConflict(StoneReservationConflictException exception) {
        return problemDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(InvalidStonePhotoDraftException.class)
    public ProblemDetail handleInvalidDraftReferences(InvalidStonePhotoDraftException exception) {
        return problemDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(StonePhotoDraftConflictException.class)
    public ProblemDetail handleDraftConflict(StonePhotoDraftConflictException exception) {
        return problemDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(StonePhotoDraftNotFoundException.class)
    public ProblemDetail handleDraftNotFound(StonePhotoDraftNotFoundException exception) {
        return problemDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(StoneNotFoundException.class)
    public ProblemDetail handleNotFound(StoneNotFoundException exception) {
        return problemDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
    @ExceptionHandler(MapperValidationException.class)
    public ProblemDetail handleMapperValidation(MapperValidationException exception) {
        return problemDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
    }

    @ExceptionHandler(InvalidAdmissionDateRangeException.class)
    public ProblemDetail handleInvalidAdmissionDateRange(InvalidAdmissionDateRangeException exception) {
        return problemDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(InvalidPhotoException.class)
    public ProblemDetail handleInvalidPhoto(InvalidPhotoException exception) {
        return problemDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(UnsupportedPhotoTypeException.class)
    public ProblemDetail handleUnsupportedPhoto(UnsupportedPhotoTypeException exception) {
        return problemDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, exception.getMessage());
    }

    @ExceptionHandler(PhotoTooLargeException.class)
    public ProblemDetail handlePhotoTooLarge(PhotoTooLargeException exception) {
        return problemDetail(HttpStatus.PAYLOAD_TOO_LARGE, exception.getMessage());
    }

    @ExceptionHandler(PhotoStorageUnavailableException.class)
    public ProblemDetail handlePhotoStorageUnavailable(PhotoStorageUnavailableException exception) {
        return problemDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail handlePersistenceFailure(DataAccessException exception) {
        return problemDetail(HttpStatus.INTERNAL_SERVER_ERROR, "The operation could not be saved. Try again later.");
    }

    @ExceptionHandler(StoneChatUnavailableException.class)
    public ProblemDetail chatUnavailable(StoneChatUnavailableException exception) {
        return chatProblem(HttpStatus.SERVICE_UNAVAILABLE, "CHAT_UNAVAILABLE", exception.getMessage());
    }
    @ExceptionHandler(StoneChatOriginRejectedException.class)
    public ProblemDetail chatOrigin(StoneChatOriginRejectedException exception) {
        return chatProblem(HttpStatus.FORBIDDEN, "CHAT_ORIGIN_REJECTED", exception.getMessage());
    }
    @ExceptionHandler(StoneChatConversationNotFoundException.class)
    public ProblemDetail chatNotFound(StoneChatConversationNotFoundException exception) {
        return chatProblem(HttpStatus.NOT_FOUND, "CHAT_CONVERSATION_NOT_FOUND", exception.getMessage());
    }
    @ExceptionHandler(StoneChatTurnConflictException.class)
    public ProblemDetail chatConflict(StoneChatTurnConflictException exception) {
        return chatProblem(HttpStatus.CONFLICT, "CHAT_TURN_CONFLICT", exception.getMessage());
    }
    @ExceptionHandler(StoneChatRateLimitedException.class)
    public ProblemDetail chatRate(StoneChatRateLimitedException exception, HttpServletResponse response) {
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(exception.getRetryAfter()));
        return chatProblem(HttpStatus.TOO_MANY_REQUESTS, "CHAT_RATE_LIMITED", exception.getMessage());
    }
    @ExceptionHandler(StoneChatConversationBusyException.class)
    public ProblemDetail chatBusy(StoneChatConversationBusyException exception, HttpServletResponse response) {
        response.setHeader(HttpHeaders.RETRY_AFTER, "1");
        return chatProblem(HttpStatus.TOO_MANY_REQUESTS, "CHAT_CONVERSATION_BUSY", exception.getMessage());
    }
    private ProblemDetail chatProblem(HttpStatus status, String code, String detail) {
        ProblemDetail problem = problemDetail(status, detail); problem.setProperty("code", code); return problem;
    }

    private ProblemDetail problemDetail(HttpStatus status, String detail) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setType(URI.create("about:blank"));
        return problemDetail;
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (body == null) body = createProblemDetail(exception, status, "Invalid request.", null, null, request);
        if (body instanceof ProblemDetail problemDetail && problemDetail.getType() == null) {
            problemDetail.setType(URI.create("about:blank"));
        }
        return super.handleExceptionInternal(exception, body, headers, status, request);
    }
}
