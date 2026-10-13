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

## Cập nhật 13/10/2026 — nhận diện không phụ thuộc Activity ID

Ảnh mới có Activity 2525339507. Bổ sung quy tắc chung cho các bài có toàn bộ đáp án selected/not selected: ít nhất sáu nhãn phân biệt, tổng ít nhất tám từ; toàn bộ chuỗi nhãn theo thứ tự phải xuất hiện trong cùng một trang, chỉ có một bài tương thích. Không thêm ID mới vào catalog. Không ghép từ vài từ rời rạc, không nhập nhằng skirts/skirt.

Kiểm thử ID mới và ID chưa biết đều đạt. Danh sách thiếu ví dụ, thiếu nhãn, nhãn trùng, nội dung rải rác, tiêu đề trái và hai bài cùng danh sách không nhận nhầm. Nhận diện vẫn hoạt động với danh sách không có role/aria-pressed, nhưng không tự bấm điều khiển chưa biết. Kiểm tra hồi quy Money Ex 1 và chọn nhiều từ trong đoạn đạt. Giới hạn DOM mô phỏng nêu trên vẫn áp dụng.
