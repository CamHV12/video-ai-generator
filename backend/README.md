# Backend — Spring Boot

This folder is a standalone Maven/Spring Boot project and can be imported directly into Spring Tool Suite (STS) or Eclipse IDE.

## Requirements

- JDK 21 installed
- Spring Tool Suite / Eclipse with the Maven (m2e) integration
- Internet access on first build so Maven can download dependencies

Check Java and Maven from a terminal:

```powershell
java -version
mvn -version
```

Both commands should report Java 21. If `mvn` is not recognized, install Apache Maven 3.9+ or configure Maven inside the IDE.

## Import into Spring Tool Suite

1. Download or clone the repository from GitHub.
2. In STS choose **File → Import… → Maven → Existing Maven Projects**.
3. For **Root Directory**, choose the repository's **backend** folder (the folder that contains `pom.xml`), not the repository root.
4. Wait for STS to find `pom.xml`, select the project and choose **Finish**.
5. Right-click the project → **Maven → Update Project…** → enable **Force Update of Snapshots/Releases** only if dependencies do not resolve → **OK**.
6. Open **Window → Preferences → Java → Installed JREs** and select a JDK 21 installation. Then open **Java → Compiler** and set compliance to 21.
7. Right-click `AiVideoGeneratorApplication.java` → **Run As → Spring Boot App**. If that menu is absent, choose **Run As → Java Application**.

If you already imported it incorrectly, remove the project from the STS workspace **without deleting files from disk**, then repeat the Maven import and select the `backend` folder.

## Run from PowerShell (alternative)

From the repository root:

```powershell
cd backend
mvn spring-boot:run
```

Health check: http://localhost:8080/api/health

## Notes

- Java source: `src/main/java`
- Configuration: `src/main/resources/application.yml`
- Tests: `src/test/java`
- Maven build output: `target/` (generated locally)
- No database is configured or required.
