# Kiểm thử 1.8.3

Edge nạp extension trên HTML mô phỏng, chưa chạy Pearson thật.

- Ex4: vẫn nhận đúng 5 câu dù đảo câu/từ; ẩn picker nhập, không còn nút tự làm từng câu; trạng thái tự sắp xếp chưa hỗ trợ bị vô hiệu hóa.
- Gọi trực tiếp MEL_SEQUENCE trên trang chỉ có thẻ từ bị từ chối; không có tip treo và không gửi dragstart.
- Nút Xuất chẩn đoán bài này thực sự tải file JSON có 5 nhóm từ.
- Thêm một input vào trang sắp xếp: phần nhập/chọn được mở lại sau Nhận bài đang mở; hàng đợi vẫn dùng được. Xóa input rồi bật lại bị từ chối, picker cũ được dọn.
- Hồi quy tự điền 12 ô, bấm lần lượt, iframe, Escape, lỗi giá trị và đổi bài.

Script: work/test-ordering-detect.cjs và work/test-auto-fill.cjs. Seed không đổi.
