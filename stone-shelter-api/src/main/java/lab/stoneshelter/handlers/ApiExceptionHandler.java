package lab.stoneshelter.handlers;

import lab.stoneshelter.exceptions.InvalidAdmissionDateRangeException;
import lab.stoneshelter.exceptions.InvalidPhotoException;
import lab.stoneshelter.exceptions.UnsupportedPhotoTypeException;
import lab.stoneshelter.exceptions.PhotoTooLargeException;
import lab.stoneshelter.exceptions.PhotoStorageUnavailableException;
import lab.stoneshelter.exceptions.StoneNotFoundException;
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
    @ExceptionHandler(StoneNotFoundException.class)
    public ProblemDetail handleNotFound(StoneNotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }
    @ExceptionHandler(MapperValidationException.class)
    public ProblemDetail handleMapperValidation(MapperValidationException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
    }

    @ExceptionHandler(InvalidAdmissionDateRangeException.class)
    public ProblemDetail handleInvalidAdmissionDateRange(InvalidAdmissionDateRangeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(InvalidPhotoException.class)
    public ProblemDetail handleInvalidPhoto(InvalidPhotoException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(UnsupportedPhotoTypeException.class)
    public ProblemDetail handleUnsupportedPhoto(UnsupportedPhotoTypeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, exception.getMessage());
    }

    @ExceptionHandler(PhotoTooLargeException.class)
    public ProblemDetail handlePhotoTooLarge(PhotoTooLargeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.PAYLOAD_TOO_LARGE, exception.getMessage());
    }

    @ExceptionHandler(PhotoStorageUnavailableException.class)
    public ProblemDetail handlePhotoStorageUnavailable(PhotoStorageUnavailableException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail handlePersistenceFailure(DataAccessException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "The operation could not be saved. Try again later.");
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (body == null) body = createProblemDetail(exception, status, "Invalid request.", null, null, request);
        return super.handleExceptionInternal(exception, body, headers, status, request);
    }
}
