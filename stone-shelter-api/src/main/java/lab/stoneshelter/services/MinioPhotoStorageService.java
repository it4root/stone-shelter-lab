package lab.stoneshelter.services;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import io.minio.errors.ErrorResponseException;
import java.io.ByteArrayInputStream;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import lab.stoneshelter.exceptions.PhotoStorageUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

@Service
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class MinioPhotoStorageService {
    private final MinioClient internalClient;
    private final MinioClient browserClient;
    private final MinioClient cleanupClient;
    private final OkHttpClient cleanupHttpClient;
    private final String endpoint;
    private final String bucket;
    private volatile boolean bucketReady;

    public MinioPhotoStorageService(@Value("${stone.photos.enabled}") boolean enabled,
            @Value("${stone.photos.endpoint}") String endpoint,
            @Value("${stone.photos.browser-endpoint}") String browserEndpoint,
            @Value("${stone.photos.bucket}") String bucket,
            @Value("${stone.photos.access-key}") String accessKey,
            @Value("${stone.photos.secret-key}") String secretKey) {
        this.bucket = bucket;
        this.endpoint = endpoint;
        cleanupHttpClient = new OkHttpClient.Builder().connectTimeout(2, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS).callTimeout(10, TimeUnit.SECONDS).build();
        cleanupClient = enabled ? MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey)
                .region("us-east-1").httpClient(cleanupHttpClient).build() : null;
        internalClient = enabled ? MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey)
                .region("us-east-1").build() : null;
        browserClient = enabled ? MinioClient.builder().endpoint(browserEndpoint).credentials(accessKey, secretKey)
                .region("us-east-1").build() : null;
    }

    public void upload(String objectKey, byte[] bytes, String mediaType) {
        checkEnabled();
        try {
            ensureBucket();
            internalClient.putObject(PutObjectArgs.builder().bucket(bucket).object(objectKey)
                    .stream(new ByteArrayInputStream(bytes), bytes.length, -1).contentType(mediaType).build());
        } catch (Exception exception) {
            throw new PhotoStorageUnavailableException(exception);
        }
    }

    public void checkAvailability() {
        checkEnabled();
        try (var response = cleanupHttpClient.newCall(new Request.Builder()
                .url(endpoint.replaceAll("/+$", "") + "/minio/health/cluster").head().build()).execute()) {
            if (response.code() != 200) throw new PhotoStorageUnavailableException();
        } catch (Exception exception) {
            throw new PhotoStorageUnavailableException(exception);
        }
    }

    public void remove(String objectKey) {
        checkEnabled();
        try {
            cleanupClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (ErrorResponseException exception) {
            if (!"NoSuchBucket".equals(exception.errorResponse().code())
                    && !"NoSuchKey".equals(exception.errorResponse().code())) {
                throw new PhotoStorageUnavailableException(exception);
            }
        } catch (Exception exception) {
            throw new PhotoStorageUnavailableException(exception);
        }
    }

    @Transactional(readOnly = true, propagation = Propagation.NOT_SUPPORTED)
    public String readUrl(String objectKey) {
        checkEnabled();
        try {
            return browserClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder().bucket(bucket)
                    .object(objectKey).method(Method.GET).expiry(1, TimeUnit.HOURS).build());
        } catch (Exception exception) {
            throw new PhotoStorageUnavailableException(exception);
        }
    }

    private void checkEnabled() {
        if (internalClient == null) throw new PhotoStorageUnavailableException();
    }

    private synchronized void ensureBucket() throws Exception {
        if (!bucketReady) {
            if (!internalClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                internalClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            bucketReady = true;
        }
    }
}
