# 9.2 Listening 4B — nhiều ô trong câu con

Chẩn đoán 1.14.13 của người dùng có bốn `li.item`, mỗi khối chứa `itemContent fillin`, nhãn số và câu a/b ngăn bằng BR. Số ô sửa được theo khối là 2, 2, 3, 5; ví dụ dog nằm trong khối 1. Nguồn tách các đáp án thành 1b-1/1b-2, 3b-1/3b-2, 4a-1…3 và 4b-1/4b-2. Quy tắc cũ không hiểu các phần này nên bỏ sót ô. Native plan trong file chẩn đoán thiếu before/after vì bộ xuất đã bỏ hai trường đó; không dùng plan này để kết luận tất cả ô thực tế không ghép được.

`lib/context.js` xuất câu con từ nhãn a)/b), nội dung văn bản và các dấu ô trống, không đọc giá trị input. Bao gồm ô ví dụ readonly trong template nhưng không thêm nó vào các ô cần ghi.

`lib/rules.js` áp dụng cho nguồn có câu hỏi kết thúc bằng ? rồi dấu gạch và phần trả lời, cùng nhãn phần rõ ràng như 1b-1. Đối chiếu số khối, nhãn chữ, toàn bộ template, số ô và chỉ số phần. Chỉ một dấu ___ là ô của mục nguồn; (…) đại diện các ô còn lại. Từ chối nếu thiếu phần, trùng phần hoặc vị trí dấu ô không khớp chỉ số. Những mục này không được dùng fallback thứ tự. Hội thoại có nhãn tương tự nhưng không có cấu trúc câu hỏi–trả lời giữ quy tắc cũ.

Kiểm thử `tests/listening-subquestions.cjs`: fixture tái hiện cấu trúc LI/BR/input từ chẩn đoán và nội dung ảnh, handler ghi input mô phỏng. Điền đủ 12 ô với đúng hoa/thường, giữ dog, đổi thứ tự các khối và câu a/b, làm riêng 1b-2; từ chối thiếu ô, trùng khối, sai nhãn hoặc đổi nội dung. Xác nhận không Save/Submit và kho lưu không đổi. Hỗ trợ MEL_TEST_EXTENSION để kiểm tra ZIP giải nén.

Hồi quy: shopping-paragraph, paragraph-ranks, dialogue-blanks. Kho seed không đổi. Chưa kiểm chứng audio/đáp án chấm hoặc lưu bài trực tiếp trên Pearson.
