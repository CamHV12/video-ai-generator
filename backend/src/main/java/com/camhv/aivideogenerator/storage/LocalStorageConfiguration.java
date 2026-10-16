package com.camhv.aivideogenerator.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LocalStorageConfiguration {

    @Bean
    public StorageDirectories storageDirectories(
            @Value("${app.storage.root:../data}") String storageRoot) throws IOException {
        Path root = Path.of(storageRoot).toAbsolutePath().normalize();
        Path inputImages = Files.createDirectories(root.resolve("input").resolve("images"));
        Path inputVideos = Files.createDirectories(root.resolve("input").resolve("videos"));
        Path output = Files.createDirectories(root.resolve("output"));
        Path temp = Files.createDirectories(root.resolve("temp"));

        return new StorageDirectories(root, inputImages, inputVideos, output, temp);
    }

    public record StorageDirectories(
            Path root,
            Path inputImages,
            Path inputVideos,
            Path output,
            Path temp) {
    }
}
