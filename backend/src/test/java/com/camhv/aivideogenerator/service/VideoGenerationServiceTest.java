package com.camhv.aivideogenerator.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class VideoGenerationServiceTest {
    @TempDir
    Path tempDir;

    @Test
    void rejectsUnsupportedAspectRatioBeforeCallingProvider() {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());
        RunwayClient runway = mock(RunwayClient.class);
        VideoGenerationService service = new VideoGenerationService(storage, runway);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.start(tempDir.resolve("image.png"), tempDir.resolve("video.mp4"), 5, "4:3"));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void rejectsDurationOutsideModelRange() {
        LocalFileStorageService storage = new LocalFileStorageService(tempDir.toString());
        RunwayClient runway = mock(RunwayClient.class);
        VideoGenerationService service = new VideoGenerationService(storage, runway);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.start(tempDir.resolve("image.png"), tempDir.resolve("video.mp4"), 3, "9:16"));

        assertEquals(400, exception.getStatusCode().value());
    }
}
