# 9.1 · Reading · Ex 5 — trạng thái checkbox

Ảnh ngày 13/10/2026: bốn lý do trồng rau, khớp nguồn ta2-u9-x-exx-d. Trang dùng checkbox nhưng nguồn ghi selected/not selected, khiến bộ ghép cũ tìm chữ selected như nhãn lựa chọn và không ghép được.

Bổ sung section 9.1, Reading, Exercise 5 vào catalog, giữ seed và đáp án. Quy tắc nativePlan chung dùng prompt tìm nhãn checkbox, answer xác định checked. Chỉ tạo thao tác khi mọi hàng không phải ví dụ đều ghép duy nhất; không ghép trạng thái này vào radio/ô nhập, không bỏ tích checkbox ngoài danh sách. Bỏ dấu ngoặc kép đơn/đôi ngoài nhãn khi đối chiếu, vẫn giữ nội dung câu.

Kiểm thử tests/checkbox-states.cjs trên MV3 trong Edge với HTML/handler mô phỏng:

- Tích relax, better taste, extra money; bỏ tích cheaper nếu đang sai.
- Chạy lại không bấm dư; làm riêng câu 3 không đổi câu khác.
- Nhãn đổi thứ tự vẫn ghép đúng, checkbox không liên quan giữ nguyên.
- Thiếu/trùng nhãn không ghi; click bị chặn dừng, đổi Exercise từ chối.
- Kho lưu không bị sửa, không Save/Submit.

Hồi quy money-word-list và single-reading-choice đạt. Chưa kiểm thử trực tiếp trên phiên Pearson thật.
