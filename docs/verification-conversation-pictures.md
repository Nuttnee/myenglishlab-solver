# Listening 8.3 · Exercise 5A

Ngày: 2026-10-02. Manifest nội bộ: 1.14.3. Drag engine: 1.10.4.

Ảnh người dùng xác nhận 8.3 Listening Exercise 5A, Activity 2520707414, bốn cảnh mua sắm khớp `ta2-u8-x-exx-p`, image258. Nguồn đánh số theo hội thoại: 1 là hình dưới trái (ví dụ), 2 dưới phải (xem quần jeans), 3 trên trái (nhân viên đưa món đồ), 4 trên phải (thanh toán).

Catalog bổ sung danh tính và thứ tự hình đã đối chiếu: 3, 4, 1, 2. Metadata bố cục chỉ được áp dụng khi toàn bộ số câu, prompt, đáp án và cờ ví dụ trong nguồn vẫn khớp bản đối chiếu; giữ nguyên items, seed và kho lưu. Không suy ra thứ tự hình từ số hội thoại.

Adapter response-series chung hỗ trợ thứ tự hình có bằng chứng ngoài nhãn A/B/C. Vẫn yêu cầu chuỗi RESPONSE liên tục duy nhất, khay liên quan, tập nhãn đầy đủ, ví dụ đúng vị trí và nhãn hiển thị không mâu thuẫn. Với bố cục đã đối chiếu, còn kiểm tra các ô đích tạo đúng lưới hàng/cột theo thứ tự. Đổi bố cục thì không dùng ánh xạ. Không suy đáp án từ data-id của thẻ nguồn. Không Save/Submit.

`node tests/conversation-pictures.cjs` đạt với extension MV3 trong Edge:

- Nhận bằng header/Activity ID, giữ seed và chỉnh sửa kho; sửa nội dung nguồn thì bỏ metadata bố cục.
- Ba nhãn 3/4/2 đúng ô, ví dụ 1 giữ nguyên; chạy lại không kéo thêm.
- Thẻ nguồn bị xáo data-id, ô được render lại và fallback bàn phím đều hoạt động.
- Sai ví dụ, thiếu/trùng ô, thiếu thẻ, khay không khớp, bố cục đổi thành một hàng hoặc sự kiện bị bỏ qua: không đoán/không báo thành công.

Hồi quy `picture-labels.cjs` đạt. Trang, class response-series và handler là mô phỏng từ adapter Pearson hiện có; chưa có JSON DOM của Ex 5A này, chưa xác minh trên Pearson thật hoặc việc lưu/chấm.
