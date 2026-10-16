package com.camhv.aivideogenerator.storage;

import com.camhv.aivideogenerator.service.LocalFileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LocalFileStorageServiceTest {
    @TempDir
    Path tempDir;

    @Test
    void rejectsFilesSmallerThanRunwayMinimumUploadSize() {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());
        MockMultipartFile image = new MockMultipartFile(
                "image", "tiny.png", "image/png", new byte[511]);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> storage.saveImage(image));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void acceptsFileAtRunwayMinimumSize() {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());
        MockMultipartFile image = new MockMultipartFile(
                "image", "small.png", "image/png", new byte[512]);

        Path saved = storage.saveImage(image);

        org.junit.jupiter.api.Assertions.assertTrue(java.nio.file.Files.exists(saved));
    }
}
