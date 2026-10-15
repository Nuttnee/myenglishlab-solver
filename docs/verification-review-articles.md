# R3 — Exercise 10: articles

Ảnh ngày 2026-10-15: bài đã nhận, 13 ô đã chọn, hai ô actor còn trống. Fixture độc lập tái hiện đầy đủ đoạn trong ảnh, 15 select và ví dụ A readonly. Trước sửa, kiểm thử trả đúng lỗi: done 13, unresolved câu 2 (an) và câu 5 (The).

Nguyên nhân: prompt nguồn `carrying ___ actor,` và `___ actor says,` chỉ có hai từ ngữ cảnh, không đạt ngưỡng blank-neighbours. Bổ sung bằng chứng `short-select-neighbours`: phải khớp toàn bộ hai phía prompt có đúng một chỗ trống, tổng ít nhất hai từ, select thuộc vùng nhiều ô, option duy nhất. Sau ghép hai chiều, chỉ giữ kết quả nếu ít nhất hai select khác cùng context/slotCount đã được ghép mạnh, khác vị trí. Ghép ngắn không hỗ trợ lẫn nhau. Không sửa seed, catalog hoặc dùng lesson ID.

`tests/review-articles.cjs`: MV3 Edge, văn bản từ ảnh; option inventory a/an/the/- và native change handler mô phỏng. Trên source và ZIP giải nén: chọn đủ 15 ô, giữ A, câu 2 an/câu 5 nhãn the (nguồn The được so không phân biệt hoa thường với option), làm riêng câu 2/5, bài đã chọn một phần, thiếu option bỏ ô tương ứng, thiếu hai mốc không ghi cụm ngắn, đoạn trùng không ghi, header đổi bị từ chối, không Save/Submit hoặc sửa kho lưu.

Hồi quy: guessing-paragraphs, paragraph-ranks, shopping-paragraph, listening-subquestions. Kiểm thử không xác nhận Pearson đã lưu/chấm; danh sách dropdown chưa mở trong ảnh nên được mô phỏng.
