# Function 8.3 · Exercise 3

Ngày: 2026-10-02. Manifest nội bộ: 1.14.2.

Ảnh xác nhận Function: buying things, Exercise 3, Activity 2520704313; đoạn “When I started in 1968” khớp `ta2-u8-x-exx-n`, image256. Catalog bổ sung section, exercise, sectionTitle và Activity ID. Giữ nhãn vocabulary và toàn bộ đáp án nguồn; quy tắc headerSkill hiện có đối chiếu theo tiêu đề Function.

Kiểm thử ban đầu phát hiện trường hợp `.itemContent` chứa nhiều input nhưng không có LI hoặc vùng câu hỏi bao ngoài: scope dừng ở input, mất ngữ cảnh trước/sau nên không ghép được ô. Bổ sung fallback lấy itemContent khi không có vùng câu hỏi truyền thống. Vẫn ưu tiên LI/fieldset/vùng có nhãn số câu; không thay đổi cách chấm điểm ghép ô và không dựa vào Activity ID để quyết định ô nào nhận từ nào.

`node tests/shopping-paragraph.cjs` chạy MV3 thật trong Edge với đoạn văn/input/handler mô phỏng từ ảnh:

- Nhận bài bằng header hoặc Activity ID, giữ nhãn kỹ năng nguồn và kho cache nguyên trạng.
- Sáu ô liền nhau điền PIN, sign, particular, fit, size, Can, handler change nhận đúng từng ô; giữ cash readonly. Ngữ cảnh ngắn `or ___ their name` được ghép trong danh sách có các ô neo đã xác định theo quy tắc hiện có.
- Nút từng câu chỉ điền sign; hai bản sao cùng đoạn thì không đoán; Exercise 4 từ chối đáp án Ex 3. Không Save/Submit.

Hồi quy `dialogue-blanks.cjs`, `paragraph-ranks.cjs`, `header-skill.cjs` đạt. Seed không thay đổi. Chưa có JSON DOM của bài này, chưa thử trên Pearson thật hoặc xác nhận lưu/chấm điểm.
