# 5.1 Exercise 1A — word snake

Chẩn đoán 1.14.26 ngày 2026-11-03: nhận đúng bài, không có action cho 16 ô. Các ô trong `.itemContent.firstLetterFillin`, không có ngữ cảnh hoặc số câu. DOM xen kẽ hai cột: sp, s, he, m/b, c, tr, f, m, mi, a, u, l, h/a/b; nguồn sắp theo cột. Vì vậy không được dùng chỉ số RESPONSE hay thứ tự DOM làm số câu.

Phạm vi sửa: `MELContext.describe` thêm khóa nhóm cho input text trong firstLetterFillin không có văn bản và chứa đủ ô editable; `M.nativePlan` nhận dạng bài có hướng dẫn word snake, ghép từng nhóm với các phần đáp án theo số ô và tiền tố hiện tại. Chỉ tiêu thụ các ghép bắt buộc duy nhất, loại ứng viên đã dùng, yêu cầu toàn bộ danh sách khớp trước khi tạo action. Thiếu ô, tiền tố rỗng/sai/mơ hồ hoặc maxlength không đủ thì không ghi. Phần scan/apply, kiểm tra snapshot và sự kiện input/change hiện có được giữ nguyên; không đổi seed và không thêm adapter/dependency.

`tests/fixtures/transport-prefix-fields.json` giữ field evidence và ba mẫu cấu trúc từ chẩn đoán, không chứa URL hay tài khoản. `tests/transport-prefixes.cjs` chạy MV3 Edge, bố cục từ chẩn đoán, expected answers độc lập, change handler mô phỏng. Đạt trên source và ZIP: 16 ô/13 cụm, chữ thường, taxi giữ nguyên, DOM đảo thứ tự, làm riêng hot/air/balloon rồi cả bài, chạy lại; từ chối tiền tố m/mi thành m/m, rỗng, sai, thiếu/thừa ô, không có marker, maxlength ngắn và header khác. Không Save/Submit hoặc sửa kho lưu.

Hồi quy shopping-paragraph, listening-subquestions, review-articles đạt. Chưa kiểm tra trực tiếp handler hoặc kết quả chấm Pearson. Nếu người dùng xóa/sửa sai gợi ý, cần khôi phục gợi ý để tự ghép; không đoán theo vị trí.
