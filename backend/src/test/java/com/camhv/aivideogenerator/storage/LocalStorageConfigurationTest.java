package com.camhv.aivideogenerator.storage;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalStorageConfigurationTest {

    @TempDir
    Path tempDir;

    @Test
    void createsRequiredFoldersWithoutDatabase() throws Exception {
        Path root = tempDir.resolve("local-data");

        LocalStorageConfiguration.StorageDirectories directories =
                new LocalStorageConfiguration().storageDirectories(root.toString());

        assertTrue(Files.isDirectory(directories.inputImages()));
        assertTrue(Files.isDirectory(directories.inputVideos()));
        assertTrue(Files.isDirectory(directories.output()));
        assertTrue(Files.isDirectory(directories.temp()));
    }
}
