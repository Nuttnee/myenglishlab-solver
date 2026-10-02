# Shopping 8.3 · Exercise 1

Ngày: 2026-10-02. Manifest nội bộ: 1.14.1.

Ảnh người dùng xác nhận 8.3 Vocabulary: shopping, Exercise 1, Activity 2520702898. Sáu gợi ý ngang và số ô khớp `ta2-u8-x-exx-l` (image253): STORE ví dụ, BRAND, SALE, PRICE, EXPENSIVE, MARKET. Catalog bổ sung section/exercise/Activity ID; seed, đáp án và ghi chú nguồn giữ nguyên.

Không đổi adapter crossword. Adapter hiện có hỗ trợ số câu không ghi hướng nếu hình học nhóm ô xác định được hàng ngang hoặc dọc; kiểm tra độ dài, chữ ví dụ và các ô giao nhau trước khi nhập.

`node tests/shopping-crossword.cjs` đạt trên extension MV3 trong Edge:

- Nhận bài bằng tiêu đề hoặc Activity ID, kể cả kho cache chưa có metadata. Không nhận nhầm section, kỹ năng hoặc số bài khác.
- Lưới toàn hàng ngang: điền 5 từ, 29 ký tự; thứ tự input trong DOM bị đảo vẫn nhập đúng theo tọa độ. Giữ STORE.
- Handler keyup mô phỏng nhận 29 ký tự; chạy lại bỏ qua cả 5 từ. Không Save/Submit.
- Chỉ điền một hàng khi yêu cầu; thiếu ô hoặc chữ ví dụ không khớp thì không ghi; đổi Exercise thì từ chối.

Lưới và class `response-RESPONSE_*` là mô phỏng dựa trên adapter Pearson đã có; chưa có JSON DOM của bài Shopping này. Chưa thử trên Pearson thật hoặc xác nhận lưu/chấm. Nếu trang dùng cấu trúc khác, cần chẩn đoán để xác định; không suy ra hỗ trợ trực tiếp từ ảnh.
