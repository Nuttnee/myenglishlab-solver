# Nhận tiêu đề bài độc lập với nhãn kỹ năng

Ngày 2026-10-02. Ảnh người dùng cho thấy **7.1 · Grammar: used to · Exercise 5A**, Activity 2520684075, trang 1/2. Sáu câu khớp đầy đủ với `ta2-u7-x-ex5a` trong kho: She ... very shy; I ... a car; My granddad ... me sweets; I never ... at school; They ... in America; Did you ... to the cinema?

## Nguyên nhân và sửa đổi

Kho gắn skill=listening, thiếu section/sectionTitle và đánh dấu số bài là suy đoán. Trang Pearson có skill đọc từ header là grammar. Bộ ghép cũ coi khác nhãn kỹ năng là mâu thuẫn nên không chọn được bài dù đáp án đã có.

Quy tắc chung: dùng nhóm chủ đề được ghi rõ trong sectionTitle để đối chiếu header; chỉ dùng skill làm dự phòng khi chưa có chủ đề rõ ràng. Giữ skill để lọc kho và mô tả hoạt động. Bài nghe nằm trong mục Grammar không còn bị loại do nhãn listening.

Catalog bổ sung section 7.1, sectionTitle Grammar: used to, Exercise 5A và Activity ID theo ảnh. Bỏ dấu suy đoán cho các trường đã được catalog xác minh. Không đổi seed, đáp án, dữ liệu đã lưu; không thêm nhánh điền theo ID bài. Metadata do người dùng sửa mà mâu thuẫn vẫn được giữ nguyên và không tự bổ sung liên kết.

## Kiểm thử đạt

- `tests/header-skill.cjs`: nhận bằng ID và bằng tiêu đề khi không có ID; skill vẫn là listening, nội dung đáp án không đổi. Quy tắc cũng hoạt động với bài giả lập ngoài catalog để xác nhận không gắn riêng với 5A.
- Từ chối sai section, sai chủ đề, sai exercise, hai bài trùng và metadata nhập khác. Liên kết ID đã lưu không được vượt qua mâu thuẫn exercise.
- Extension MV3 trong Edge với kho cũ: tự chọn 7.1 Ex 5A; điền năm ô đúng, phát change, giữ ví dụ, không Save/Next. Khi giả lập chuyển header sang 5B nhưng giữ Activity ID, không ghi đáp án 5A vào các ô mới.
- Hồi quy `tests/review-detection.cjs`: R2 Ex 6 và các biến thể tiêu đề Review đạt.
- Hồi quy `work/test-reading-5a.cjs` trong workspace phát triển: Reading 6.2 Ex 5A, kho cũ và mâu thuẫn metadata đạt.

## Giới hạn

Chưa có DOM chẩn đoán của bài này. Test dựng trang input theo ảnh với handler mô phỏng, chưa thử trực tiếp phiên Pearson và chưa xác nhận lưu/chấm. Ảnh chỉ cung cấp trang 1/2; không kết luận trang 2 là bài gì và không tự chuyển trang. Trường hợp 5B trong test là tình huống kiểm tra từ chối, không phải khẳng định nội dung trang 2.

Seed SHA256 giữ nguyên: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
