package com.camhv.aivideogenerator.controller;

import com.camhv.aivideogenerator.service.LocalFileStorageService;
import com.camhv.aivideogenerator.service.VideoGenerationService;
import com.camhv.aivideogenerator.service.VideoGenerationService.TaskView;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

@RestController
@RequestMapping("/api/generations")
public class VideoGenerationController {
    private final LocalFileStorageService storage;
    private final VideoGenerationService generationService;

    public VideoGenerationController(LocalFileStorageService storage, VideoGenerationService generationService) {
        this.storage = storage;
        this.generationService = generationService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TaskView> create(
            @RequestPart("image") MultipartFile image,
            @RequestPart("referenceVideo") MultipartFile referenceVideo,
            @RequestParam(defaultValue = "5") int duration,
            @RequestParam(defaultValue = "9:16") String aspectRatio) {
        Path imagePath = storage.saveImage(image);
        Path videoPath = storage.saveVideo(referenceVideo);
        return ResponseEntity.accepted().body(generationService.start(imagePath, videoPath, duration, aspectRatio));
    }

    @GetMapping("/{id}")
    public TaskView status(@PathVariable String id) {
        return generationService.get(id);
    }

    @GetMapping("/{id}/video")
    public ResponseEntity<Resource> video(@PathVariable String id) {
        Path path = generationService.output(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/mp4"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"generated-video.mp4\"")
                .body(new FileSystemResource(path));
    }
}
