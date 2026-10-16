# Backend — Spring Boot

Backend Java 21 của AI Video Generator. Backend nhận file, lưu vào ổ đĩa cục bộ, upload file tạm lên Runway Dev, khởi tạo Seedance 2.5 và lưu video kết quả.

## Cấu hình API key

Trong PowerShell:

```powershell
setx RUNWAYML_API_SECRET "DAN_API_KEY_CUA_BAN_VAO_DAY"
```

Thay giá trị mẫu bằng key thật trên máy của bạn, sau đó khởi động lại terminal/IDE. Không đưa key vào mã nguồn, GitHub hoặc biến `VITE_*`.

## Chạy

Yêu cầu JDK 21 và Maven 3.9+.

```powershell
cd backend
mvn spring-boot:run
```

Health check: http://localhost:8080/api/health

## API của ứng dụng

- `POST /api/generations` — multipart gồm `image`, `referenceVideo`, `duration` (4–30), `aspectRatio` (`9:16`, `16:9`, `1:1`).
- `GET /api/generations/{id}` — kiểm tra trạng thái.
- `GET /api/generations/{id}/video` — tải/phát video khi tác vụ thành công.

Mỗi ảnh/video tối đa 200 MB. File được lưu dưới `APP_STORAGE_ROOT` (mặc định `../data`, tương ứng thư mục `data` ở repository root khi chạy từ thư mục backend). Không cần database.

## Kiểm thử

```powershell
mvn test
```
