package com.camhv.aivideogenerator.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.BAD_GATEWAY;

@Service
public class VideoGenerationService {
    private static final String FIXED_PROMPT = "Use the uploaded source image as the identity and scene reference, and use the uploaded reference video only as the motion/action reference. Generate a video in which the subject from the source image performs the same actions and movement pattern as the subject in the reference video, matching timing, gestures, body movement, and overall motion as closely as the model allows. Preserve the source image's composition, camera angle, framing, aspect ratio, camera-to-subject distance, background, props, environment, lighting, shadows, colors, and overall color grading. Do not add, remove, or rearrange objects. Avoid camera movement, zoom, reframing, cropping, flicker, warping, identity drift, or unintended background changes. Change only what is necessary to animate the subject and match the referenced action. Keep all other visual elements unchanged and maintain consistent identity across frames.";

    private final LocalFileStorageService storage;
    private final RunwayClient runway;
    private final Map<String, TaskState> tasks = new ConcurrentHashMap<>();

    public VideoGenerationService(LocalFileStorageService storage, RunwayClient runway) {
        this.storage = storage;
        this.runway = runway;
    }

    public TaskView start(Path imagePath, Path videoPath, int duration, String aspectRatio) {
        if (duration < 4 || duration > 30) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Thời lượng phải từ 4 đến 30 giây.");
        }
        String ratio = switch (aspectRatio) {
            case "9:16" -> "720:1280";
            case "16:9" -> "1280:720";
            case "1:1" -> "960:960";
            default -> throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Tỷ lệ khung hình không hợp lệ.");
        };

        String imageUri = runway.uploadEphemeral(imagePath);
        String videoUri = runway.uploadEphemeral(videoPath);
        String runwayId = runway.createVideoTask(imageUri, videoUri, duration, ratio, FIXED_PROMPT);
        String localId = UUID.randomUUID().toString();
        tasks.put(localId, new TaskState(localId, runwayId, "PENDING", 0, null, null));
        return view(tasks.get(localId));
    }

    public TaskView get(String localId) {
        TaskState current = tasks.get(localId);
        if (current == null) throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy tác vụ trong phiên backend hiện tại.");

        if (!current.status.equals("SUCCEEDED") && !current.status.equals("FAILED")) {
            JsonNode remote = runway.getTask(current.runwayId);
            String status = remote.path("status").asText("PROCESSING").toUpperCase();
            int progress = remote.path("progress").asInt(current.progress);
            if (status.equals("SUCCEEDED")) {
                try {
                    String outputUrl = firstOutput(remote.path("output"));
                    byte[] bytes = runway.downloadOutput(outputUrl);
                    Files.createDirectories(storage.outputDirectory());
                    Path destination = storage.outputDirectory().resolve("video-" + current.id + ".mp4");
                    Files.write(destination, bytes);
                    current = current.with("SUCCEEDED", 100, destination, null);
                } catch (IOException | RuntimeException exception) {
                    if (exception instanceof ResponseStatusException responseStatusException) throw responseStatusException;
                    current = current.with("FAILED", progress, null, "Không thể lưu video kết quả vào thư mục cục bộ.");
                }
            } else if (status.equals("FAILED") || status.equals("CANCELED")) {
                String message = remote.path("failure").asText(remote.path("error").asText("Tác vụ tạo video thất bại."));
                current = current.with("FAILED", progress, null, message);
            } else {
                current = current.with("PROCESSING", Math.max(0, Math.min(progress, 99)), null, null);
            }
            tasks.put(localId, current);
        }
        return view(current);
    }

    public Path output(String localId) {
        TaskView view = get(localId);
        TaskState state = tasks.get(localId);
        if (!view.status().equals("SUCCEEDED") || state.outputPath == null || !Files.exists(state.outputPath)) {
            throw new ResponseStatusException(NOT_FOUND, "Video chưa sẵn sàng.");
        }
        return state.outputPath;
    }

    private String firstOutput(JsonNode output) {
        if (output.isArray() && output.size() > 0) return output.get(0).asText();
        if (output.isTextual()) return output.asText();
        throw new ResponseStatusException(BAD_GATEWAY, "Runway không trả về URL video trong kết quả.");
    }

    private TaskView view(TaskState state) {
        return new TaskView(state.id, state.status, state.progress,
                state.status.equals("SUCCEEDED") ? "/api/generations/" + state.id + "/video" : null,
                state.error);
    }

    private record TaskState(String id, String runwayId, String status, int progress, Path outputPath, String error) {
        TaskState with(String status, int progress, Path outputPath, String error) {
            return new TaskState(id, runwayId, status, progress, outputPath, error);
        }
    }

    public record TaskView(String id, String status, int progress, String videoUrl, String error) {}
}
