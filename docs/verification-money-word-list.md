# Money · Unit 8 · Ex 6 — chọn từ trong danh sách

Ảnh người dùng ngày 02/10/2026: Money Exercise 6, Activity 2520713102; yêu cầu chọn đồ đã mua và có ba từ thừa. Toàn bộ 14 nhãn khớp bài `ta2-u8-x-exx-w` trong nguồn image265. Bổ sung tiêu đề Money, Exercise 6 và Activity; không sửa seed hoặc kho đã lưu.

Cơ chế chọn nhiều từ bổ sung cách đọc hàng có đáp án `selected` / `not selected`: prompt là nhãn trên trang. Chỉ ghép khi toàn bộ nhãn (gồm ví dụ) khớp một vùng cục bộ duy nhất; mỗi nhãn sửa được có đúng một nút thuộc nhóm `.underlineGroup.multiple`, có role button và aria-pressed hợp lệ. Giữ nguyên số ít/số nhiều. Không có nhánh theo lesson ID trong adapter.

Kết quả mong đợi: giữ book ví dụ, chọn dress, handbag, sunglasses, skirts, shoes, coat, telephone, trainers, tops, trousers; không chọn jacket, hat, skirt. Nếu một từ không đúng đang được chọn, giữ nguyên và báo để người dùng kiểm tra, không tự xóa.

Kiểm thử `tests/money-word-list.cjs` với MV3 trong Edge đạt:

- Nhận bằng ID đã xác minh, từ chối Exercise mâu thuẫn hoặc chỉ có số 6.
- Chọn 10 từ, giữ ba từ không chọn và ví dụ; chạy lại không bấm lặp.
- Chọn riêng skirts; chọn riêng yêu cầu không chọn skirt không gây click.
- Từ chối danh sách thiếu/trùng, ví dụ khác và thiếu trạng thái aria-pressed.
- Dừng khi click không được ghi nhận, làm mất lựa chọn khác hoặc chuyển bài.
- Không Save/Submit, không sửa kho đã lưu.

Hồi quy `tests/multiple-words.cjs` (đoạn văn 8.2 Ex 6B) đạt. HTML Ex 6 dựng lại từ ảnh bằng cấu trúc widget từng thấy ở bài khác, handler mô phỏng; chưa có JSON chẩn đoán hoặc kiểm thử trực tiếp Pearson của Ex 6. Nếu trang thật không dùng cấu trúc này, cần Xuất chẩn đoán để bổ sung bằng chứng.
