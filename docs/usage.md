# Cài đặt và sử dụng

## Cài lần đầu

1. Tải **myenglishlab-solver.zip** ở [bản phát hành mới nhất](https://github.com/Nuttnee/myenglishlab-solver/releases/latest). Hai mục Source code của GitHub là mã nguồn, không phải gói cài gọn.
2. Giải nén vào thư mục cố định trên máy.
3. Mở `chrome://extensions` hoặc `edge://extensions`, bật **Developer mode**, chọn **Load unpacked** và chọn thư mục chứa `manifest.json`.
4. Mở MyEnglishLab và đăng nhập như thường lệ. Bấm **EN**, icon extension hoặc **Alt+Shift+M** để mở bảng.

## Cập nhật

Chép các file trong ZIP mới vào đúng thư mục đã nạp. Bấm **Reload** ở trang quản lý extension rồi **F5** trang MyEnglishLab. Giữ nguyên đường dẫn để giữ dữ liệu đã lưu. Nếu đổi thư mục, xuất kho JSON ở bản cũ trước rồi nhập vào bản mới. Tắt extension helper cũ nếu thấy hai bảng.

## Làm bài

1. Mở bài trên Pearson và kiểm tra tên bài trong bảng **MyEnglishLab Solver**.
2. Nếu cần, bấm **Nhận bài đang mở**. Khi chưa tự nhận, tìm và chọn đúng bài trong kho; **Ghi nhớ bài đang mở** lưu liên kết cho lần sau.
3. Bấm nút tự làm phù hợp với bài: điền, chọn, ô chữ, sắp xếp hoặc kéo thả. Extension chỉ làm phần ghép được và báo câu còn thiếu.
4. Kiểm tra đáp án trên trang rồi tự **Save/Submit**.

**Dừng thao tác** ngắt công việc đang chạy. Với ô nhập/chọn được hỗ trợ, có thể dùng **Xem / đổi ghép ô**, **Chỉ vị trí** hoặc **Bấm ô lần lượt**; nhấn Esc để thoát chế độ bấm ô. Các lựa chọn này không áp dụng cho mọi dạng kéo thả.

## Khi chưa nhận bài hoặc không thao tác được

- Kiểm tra đã Reload extension và F5 trang sau cập nhật.
- Kiểm tra bài chọn trong kho khớp với section, số Exercise và nội dung đang mở.
- Bấm **Xuất chẩn đoán**, gửi file JSON cùng ảnh có tiêu đề bài và trạng thái lỗi.

File chẩn đoán được tải về máy, không tự gửi. File có ngữ cảnh câu hỏi và cấu trúc điều khiển trong vùng bài để phân tích. Kết quả trên trang chưa chứng minh Pearson đã lưu/chấm bài. Những widget khác cấu trúc được hỗ trợ có thể cần bổ sung cơ chế.

## Kho dữ liệu

Chọn khóa học, Unit hoặc dạng bài để lọc; dùng tìm kiếm để tìm nhanh. Có thể copy đáp án và nhập/xuất kho JSON. Danh mục liên kết bổ sung được áp dụng khi đọc kho, giữ đáp án nguồn và những chỉnh sửa metadata mâu thuẫn của người dùng.
