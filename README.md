# AI Video Generator

Ứng dụng tạo video AI chạy cục bộ trên Windows: chọn **một ảnh nguồn** và **một video tham chiếu**, hệ thống dùng prompt tiếng Anh cố định để giữ ngoại hình/bối cảnh của ảnh và mô phỏng chuyển động của video.

## Công nghệ

- Frontend: React, Vite, TypeScript.
- Backend: Java 21, Spring Boot.
- AI: Runway Dev API — Seedance 2.5.
- File: lưu cục bộ trong thư mục `data/`; không dùng database.

## 1. Chuẩn bị

Cài Node.js LTS, JDK 21 và Maven 3.9+. Tạo API key tại [Runway Dev](https://dev.runway.com/). API generation sẽ tiêu tốn credit; hãy kiểm tra số dư và giá hiển thị trong tài khoản trước khi tạo video.

Trong PowerShell, cấu hình key trên máy của bạn (không gửi key vào chat, không commit key):

```powershell
setx RUNWAYML_API_SECRET "DAN_API_KEY_CUA_BAN_VAO_DAY"
```

Thay chuỗi mẫu bằng API key thật ngay trong PowerShell của bạn. Sau đó đóng và mở lại terminal/IDE để nhận biến môi trường.

## 2. Chạy backend

```powershell
cd backend
mvn spring-boot:run
```

Health check: http://localhost:8080/api/health

## 3. Chạy frontend

Mở terminal thứ hai:

```powershell
cd frontend
npm install
npm run dev
```

Mở URL Vite hiển thị, thường là http://localhost:5173.

## Luồng tạo video

1. Chọn ảnh JPG/PNG/WebP và video MP4/MOV/WebM.
2. Chọn thời lượng 5 hoặc 10 giây và tỷ lệ dọc/ngang/vuông.
3. Bấm **Tạo video AI**. Backend kiểm tra và lưu file vào `data/input/`, upload file tạm lên Runway, gửi yêu cầu Seedance 2.5 và theo dõi trạng thái.
4. Video hoàn tất được lưu vào `data/output/` và hiển thị trong phần kết quả.

Các file đầu vào được giới hạn 200 MB mỗi file. URI upload tạm của Runway hết hạn sau 24 giờ. Danh sách tác vụ đang chạy được giữ trong bộ nhớ backend; sau khi khởi động lại backend, các tác vụ đang chạy trước đó không còn được tra cứu từ ứng dụng.

## Cấu trúc dữ liệu cục bộ

```text
data/
  input/images/
  input/videos/
  output/
  temp/
```

Có thể đổi thư mục gốc bằng biến môi trường `APP_STORAGE_ROOT`. Không commit file cá nhân, video đầu ra hoặc API key.

## Kiểm thử

```powershell
cd backend
mvn test
```

```powershell
cd frontend
npm test
npm run build
```

## Ghi chú

- Runway là dịch vụ trực tuyến; ảnh và video tham chiếu sẽ được gửi đến Runway để xử lý.
- Kết quả có thể mất vài phút. Chi phí phụ thuộc thời lượng đầu ra, độ phân giải và thời lượng video tham chiếu.
- Chưa có database; trạng thái tác vụ chỉ tồn tại trong bộ nhớ backend.
