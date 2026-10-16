package com.camhv.aivideogenerator.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class LocalFileStorageService {
    private static final long MIN_RUNWAY_UPLOAD_BYTES = 512L;
    private static final long MAX_IMAGE_BYTES = 200L * 1024 * 1024;
    private static final long MAX_VIDEO_BYTES = 200L * 1024 * 1024;
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4", "video/quicktime", "video/webm", "video/x-matroska");

    private final Path root;

    public LocalFileStorageService(@Value("${app.storage.root:../data}") String storageRoot) {
        this.root = Path.of(storageRoot).toAbsolutePath().normalize();
    }

    public Path saveImage(MultipartFile file) {
        validate(file, IMAGE_TYPES, MAX_IMAGE_BYTES, "Ảnh phải là JPG, PNG hoặc WebP.");
        return save(file, root.resolve("input").resolve("images"));
    }

    public Path saveVideo(MultipartFile file) {
        validate(file, VIDEO_TYPES, MAX_VIDEO_BYTES, "Video phải là MP4, MOV, WebM hoặc MKV.");
        return save(file, root.resolve("input").resolve("videos"));
    }

    public Path outputDirectory() {
        return root.resolve("output");
    }

    private void validate(MultipartFile file, Set<String> allowedTypes, long maxBytes, String message) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Vui lòng chọn đầy đủ ảnh nguồn và video tham chiếu.");
        }
        if (file.getSize() < MIN_RUNWAY_UPLOAD_BYTES) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "File phải có dung lượng tối thiểu 512 byte để tải lên Runway.");
        }
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(BAD_REQUEST, "Mỗi file phải có dung lượng không vượt quá 200 MB.");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!allowedTypes.contains(type)) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
    }

    private Path save(MultipartFile file, Path directory) {
        try {
            Files.createDirectories(directory);
            String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
            String extension = original.lastIndexOf('.') >= 0 ? original.substring(original.lastIndexOf('.')).replaceAll("[^A-Za-z0-9.]", "") : "";
            Path destination = directory.resolve(UUID.randomUUID() + extension).normalize();
            if (!destination.startsWith(directory.normalize())) {
                throw new ResponseStatusException(BAD_REQUEST, "Tên file không hợp lệ.");
            }
            file.transferTo(destination);
            return destination;
        } catch (IOException exception) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Không thể lưu file vào thư mục cục bộ.", exception);
        }
    }
}
