# Danh sách API hệ thống (FormFlow)

Backend chạy tại: `http://localhost:3001/api`

 1. Xác thực (`/auth`)
- POST `/auth/register`: Đăng ký tài khoản mới.
- POST `/auth/login`: Đăng nhập (Trả về JWT token).
- GET `/auth/me`: Lấy thông tin tài khoản hiện tại.

 2. Quản lý Form (`/forms`)
- GET `/forms`: Lấy danh sách tất cả các form.
- GET `/forms/active`: Lấy danh sách các form đang trạng thái "Hoạt động" (Dành cho nhân viên).
- GET `/forms/:id`: Lấy chi tiết 1 form kèm theo các trường (fields).
- POST `/forms`: Tạo form mới (Admin).
- PUT `/forms/:id`: Cập nhật thông tin form (Admin).
- DELETE `/forms/:id`: Xóa form (Admin).
- POST `/forms/:id/submit`: Nhân viên gửi câu trả lời cho form.

 3. Quản lý các trường trong Form (`/forms/fields`)
- POST `/forms/fields`: Thêm một trường mới vào form.
- PUT `/forms/fields/:id`: Cập nhật thông tin/loại của 1 trường.
- DELETE `/forms/fields/:id`: Xóa 1 trường.
- POST `/forms/:id/fields`: Cập nhật hàng loạt (thứ tự kéo thả) các trường trong form.

 4. Phản hồi/Kết quả (`/submissions`)
- GET `/submissions`: 
  - Admin: Xem tất cả kết quả của mọi người.
  - Employee: Xem lại lịch sử nộp của chính mình.
- GET `/submissions/form/:formId`: Xem tất cả kết quả nộp của một form cụ thể (Admin).
- POST `/submissions`: Gửi câu trả lời của form.


