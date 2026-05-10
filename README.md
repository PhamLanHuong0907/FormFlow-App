# FormFlow - Hệ thống Quản lý Form Năng động

FormFlow là một ứng dụng web hiện đại cho phép tạo, quản lý và thu thập dữ liệu từ các biểu mẫu (forms) một cách linh hoạt. Dự án được thiết kế để phục vụ việc tạo form khảo sát, báo cáo nội bộ cho doanh nghiệp với trải nghiệm người dùng mượt mà.

## 🌟 Chức năng chính

### 🔐 Đối với Quản trị viên (Admin)
- **Quản lý Form**: Tạo mới, chỉnh sửa thông tin, xóa và thay đổi trạng thái (Bản nháp/Hoạt động) của Form.
- **Bộ dựng Form (Form Builder)**:
    - Giao diện kéo thả hiện đại.
    - Hỗ trợ nhiều loại câu hỏi: Văn bản, Số, Ngày tháng, Màu sắc, Lựa chọn (Select).
    - **Logic STT Thông minh**: Tự động dồn hàng và đẩy thứ tự các câu hỏi khi thay đổi STT thủ công.
- **Xem kết quả**:
    - Theo dõi danh sách phản hồi theo thời gian thực.
    - Xuất dữ liệu ra file **Excel (CSV)** hỗ trợ tiếng Việt (UTF-8).
- **Phân quyền**: Quản lý tài khoản và bảo mật dữ liệu.

### 👥 Đối với Nhân viên (Employee)
- **Danh sách Form**: Xem danh sách các form đang ở trạng thái "Hoạt động".
- **Điền Form**: Giao diện điền form trực quan với các tính năng:
    - Ràng buộc dữ liệu (Validation) theo loại câu hỏi.
    - Lối tắt chọn "Ngày hôm nay" cho các trường ngày tháng.
- **Lịch sử**: Xem lại các form đã nộp và nội dung đã trả lời.

## 🛠 Công nghệ sử dụng

- **Frontend**: React.js, Vite, Tailwind CSS, shadcn/ui, Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: SQLite (Sử dụng `better-sqlite3` cho hiệu năng cao).
- **Xác thực**: JSON Web Token (JWT) & BcryptJS.
- **Containerization**: Docker & Docker Compose.

## 🗄️ Cấu trúc Cơ sở dữ liệu (ERD)

Dưới đây là sơ đồ thực thể mối quan hệ (ERD) mô tả cấu trúc dữ liệu của FormFlow. Sơ đồ này thể hiện rõ cách các bảng liên kết với nhau, từ người dùng, biểu mẫu cho đến các trường câu hỏi và dữ liệu nộp về.

![Sơ đồ ERD FormFlow](/ERD_formflow.png)

*(File script SQL khởi tạo chi tiết được lưu trong file /server/db.js`)*

## 💻 Hướng dẫn cài đặt & Khởi chạy

### Điều kiện tiên quyết
- Đã cài đặt **Node.js** (Phiên bản 18 trở lên).
- (Tùy chọn) Đã cài đặt **Docker** & **Docker Compose**.

## 💻 Hướng dẫn cài đặt & Khởi chạy

### Điều kiện tiên quyết
- Đã cài đặt **Node.js** (Phiên bản 18 trở lên).
- (Tùy chọn) Đã cài đặt **Docker** & **Docker Compose**.

### Cách 1: Chạy trực tiếp bằng NPM (Chế độ Development)

1. **Cài đặt dependencies**:
   ```bash
   # Cài đặt cho cả Frontend và Backend
   npm install
   cd server && npm install
   cd ..
   ```

2. **Cấu hình môi trường**:
   Tạo file `.env` trong thư mục `server/` (nếu chưa có):
   ```env
   JWT_SECRET=your_secret_key
   PORT=3001
   ```

3. **Chạy ứng dụng**:
   Sử dụng lệnh gộp để chạy cả frontend và backend cùng lúc:
   ```bash
   npm run dev:full
   ```
   - Frontend sẽ chạy tại: `http://localhost:8080`
   - Backend sẽ chạy tại: `http://localhost:3001`

### Cách 2: Chạy bằng Docker Compose (Khuyên dùng cho Production/Demo)

Dự án đã được đóng gói sẵn sàng để chạy trong môi trường container.

1. **Khởi chạy container**:
   Tại thư mục gốc, chạy lệnh:
   ```bash
   docker-compose up --build -d
   ```

2. **Truy cập**:
   - Ứng dụng sẽ chạy tại: `http://localhost:8080`
   - Dữ liệu SQLite được lưu trữ bền vững tại file `server/database.sqlite` trên máy của bạn.

### Cách 3: Build và Chạy thủ công (Production)

1. **Build Frontend**:
   ```bash
   npm run build
   ```
   Các file tĩnh sẽ nằm trong thư mục `dist/`.

2. **Chạy Backend**:
   ```bash
   cd server
   node index.js
   ```

## 📂 Cấu trúc thư mục

- `/src`: Mã nguồn Frontend (React).
- `/server`: Mã nguồn Backend (Node.js).
- `/server/routes`: Chứa logic xử lý các API.
- `/server/database.sqlite`: File cơ sở dữ liệu (tự động tạo khi chạy lần đầu).
- `docker-compose.yml`: File cấu hình Docker.
