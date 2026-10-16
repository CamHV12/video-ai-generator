package com.camhv.aivideogenerator.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Component
public class RunwayClient {
    private static final Logger log = LoggerFactory.getLogger(RunwayClient.class);
    private static final String BASE_URL = "https://api.dev.runwayml.com";
    private final String apiKey;
    private final RestClient api;
    private final RestClient externalClient;

    public RunwayClient(
            @Value("${runway.api-key:}") String apiKey,
            RestClient.Builder restClientBuilder) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.api = restClientBuilder.clone()
                .baseUrl(BASE_URL)
                .defaultHeader("Authorization", "Bearer " + this.apiKey)
                .defaultHeader("X-Runway-Version", "2024-11-06")
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.externalClient = restClientBuilder.clone().build();
    }

    public String uploadEphemeral(Path path) {
        ensureConfigured();
        try {
            JsonNode upload = api.post()
                    .uri("/v1/uploads")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("filename", path.getFileName().toString(), "type", "ephemeral"))
                    .retrieve()
                    .body(JsonNode.class);
            if (upload == null || upload.path("uploadUrl").asText().isBlank()
                    || upload.path("runwayUri").asText().isBlank() || !upload.hasNonNull("fields")) {
                throw new IllegalStateException("Runway trả về thông tin upload không hợp lệ.");
            }

            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            JsonNode fields = upload.path("fields");
            fields.fields().forEachRemaining(entry -> form.add(entry.getKey(), entry.getValue().asText()));
            form.add("file", new FileSystemResource(path));

            externalClient.post()
                    .uri(upload.path("uploadUrl").asText())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();

            return upload.path("runwayUri").asText();
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            log.error("Runway ephemeral upload failed for file '{}': {}",
                    path.getFileName(), safeFailureSummary(exception));
            throw new ResponseStatusException(BAD_GATEWAY,
                    "Không thể tải file lên Runway. Hãy kiểm tra log backend để xem nguyên nhân chi tiết.", exception);
        }
    }

    private static String safeFailureSummary(Throwable exception) {
        Throwable root = exception;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage() == null ? "(không có thông điệp)" : root.getMessage();
        // Do not write signed upload URLs or credentials to logs.
        message = message.replaceAll("https?://\\S+", "[URL]");
        message = message.replaceAll("(?i)Bearer\\s+\\S+", "Bearer [REDACTED]");
        message = message.replaceAll("key_[0-9a-fA-F]{128}", "[REDACTED_API_KEY]");
        if (message.length() > 500) message = message.substring(0, 500) + "...";
        return root.getClass().getSimpleName() + ": " + message;
    }

    public String createVideoTask(String imageUri, String videoUri, int duration, String ratio, String prompt) {
        ensureConfigured();
        Map<String, Object> request = Map.of(
                "model", "seedance2_5",
                "promptText", prompt,
                "references", List.of(Map.of("uri", imageUri)),
                "referenceVideos", List.of(Map.of("type", "video", "uri", videoUri)),
                "duration", duration,
                "ratio", ratio,
                "audio", false
        );
        try {
            JsonNode response = api.post()
                    .uri("/v1/text_to_video")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
            String id = response == null ? "" : response.path("id").asText("");
            if (id.isBlank()) {
                throw new IllegalStateException("Runway không trả về mã tác vụ.");
            }
            return id;
        } catch (Exception exception) {
            throw new ResponseStatusException(BAD_GATEWAY,
                    "Runway không thể khởi tạo tác vụ tạo video. Kiểm tra quyền model và số dư credit.", exception);
        }
    }

    public JsonNode getTask(String taskId) {
        ensureConfigured();
        try {
            JsonNode response = api.get().uri("/v1/tasks/{taskId}", taskId).retrieve().body(JsonNode.class);
            if (response == null) throw new IllegalStateException("Runway trả về phản hồi rỗng.");
            return response;
        } catch (Exception exception) {
            throw new ResponseStatusException(BAD_GATEWAY, "Không thể lấy trạng thái tác vụ từ Runway.", exception);
        }
    }

    public byte[] downloadOutput(String outputUrl) {
        try {
            byte[] bytes = externalClient.get().uri(outputUrl).retrieve().body(byte[].class);
            if (bytes == null || bytes.length == 0) throw new IllegalStateException("Video đầu ra rỗng.");
            return bytes;
        } catch (Exception exception) {
            throw new ResponseStatusException(BAD_GATEWAY, "Tạo video xong nhưng không tải được file kết quả.", exception);
        }
    }

    private void ensureConfigured() {
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE,
                    "Chưa cấu hình RUNWAYML_API_SECRET trên máy chạy backend.");
        }
    }
}
