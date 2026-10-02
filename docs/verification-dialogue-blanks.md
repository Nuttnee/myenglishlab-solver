# Ô kéo thả trong nhiều hội thoại

Ngày: 2026-10-02. Bài báo lỗi: **7.3 · Function: finding out information · Exercise 2**.

Ảnh có ba Conversation, lặp `A: ___ you.` và hai chỗ `Sorry`. Kho study có 15 đáp án, đánh số `1.1`–`3.7`; phần `library` phía đầu là ví dụ ngoài 15 đáp án đó. Nguồn chưa có tiêu đề đầy đủ, nên metadata được bổ sung trong catalog, không sửa seed.

## Lỗi tái hiện

Trên fixture dựng theo ảnh (11 đáp án đã có, bốn ô còn trống), bản trước sửa báo năm đáp án chưa ghép được: ba `Thank` và hai `Sorry`. Một `Sorry` đã hiện trên trang cũng không được tính hoàn tất vì chưa ghép được với đúng câu nguồn.

## Quy tắc chung

- Dùng nhãn Conversation/Dialogue trên trang làm ranh giới hội thoại.
- Chỉ suy ra nhóm từ số câu dạng `2.1` khi chính nguồn có tiêu đề Conversation 2 tương ứng. Không tự đoán nhóm từ thứ tự hiển thị.
- Với câu rất ngắn, ghép mẫu câu quanh một ô trên cùng dòng, trong đúng hội thoại. Dòng được ngăn bằng khối HTML hoặc BR; hỗ trợ thẻ nội tuyến.
- Khi nguồn chứa cả câu thoại trước, dùng nội dung liền trước trong cùng hội thoại để ghép.
- Vẫn giữ quy tắc duy nhất: thiếu nhãn hoặc trùng ngữ cảnh thì không chọn đại. Giữ ô đã điền và ví dụ.

Không có nhánh thao tác theo Unit, Exercise hay Activity ID. Không bổ sung hoặc sửa đáp án nguồn.

## Kiểm thử

`tests/dialogue-blanks.cjs`: Edge, extension MV3 thật, các sự kiện HTML5 của trang mô phỏng.

- Trạng thái như ảnh: kéo ba `Thank` và một `Sorry`, nhận 11 đáp án đã có; giữ ví dụ `library`.
- Bài trắng: điền đủ 15 đáp án trong kho.
- Đảo thứ tự hội thoại vẫn đúng, cả cấu trúc dòng P riêng và cấu trúc dùng BR chung.
- Biến thể kiểm thử có cùng mẫu câu ngắn nhưng đáp án khác nhau ở từng hội thoại vẫn ghép đúng sau khi đảo DOM.
- Nhãn hội thoại bị thiếu hoặc đoạn bị nhân đôi không gây chọn ô trùng tùy tiện.
- Chạy lại không kéo thêm; không Submit.

Hồi quy đạt: `inline-drag-blanks.cjs` (7.2 Ex 4), `paragraph-ranks.cjs`, `header-skill.cjs`, `picture-labels.cjs`, `review-detection.cjs`.

Giới hạn: DOM và handler được dựng theo ảnh, chưa có chẩn đoán DOM thật của bài này. Chưa xác nhận trên phiên Pearson thật hoặc phía máy chủ. Không tự Save/Submit.
