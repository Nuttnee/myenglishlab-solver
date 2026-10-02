# Nhận 7.1 Reading Exercise 6 — nhãn đoạn văn vào hình

Ngày 2026-10-02. Ảnh người dùng xác nhận section 7.1, Reading, Exercise 6, Activity 2520684784 và tiêu đề bài đọc BEFORE THEY WERE FAMOUS. Sáu hình là bút A, tủ lạnh B, gà C, bánh doughnut D, quần áo E và thức ăn nhanh F. B có Paragraph 1 là ví dụ cố định.

Kho đã có `ta2-u7-x-exx-i217` với đáp án A=4, B=1 (ví dụ), C=3, D=2, E=6, F=5 nhưng thiếu section, sectionTitle, exercise và Activity ID. Nội dung bài đọc không nằm trong passage của bản nguồn; mô tả hình trong prompt không đủ để tự ghép với text trên trang.

## Thay đổi

Chỉ bổ sung metadata đã đối chiếu trong catalog để nhận 7.1 Reading Ex 6. Giữ nguyên seed và đáp án. Không đổi adapter kéo thả: cơ chế response-series hiện có hỗ trợ ví dụ tại B, không bắt buộc ví dụ nằm ở ô đầu tiên. Không thêm nhánh thao tác theo ID của bài.

## Kiểm thử đạt

`tests/picture-labels.cjs` chạy MV3 thực trong Edge với kho đã lưu từ bản cũ:

- Nhận bằng Activity ID và bằng tiêu đề khi không có ID; từ chối tiêu đề mâu thuẫn, nhiều bài cùng khớp và không ghi đè metadata người dùng sửa.
- Tự kéo năm nhãn vào A/C/D/E/F đúng, giữ B=Paragraph 1; không Submit. Chạy lại bỏ qua năm ô đã đúng.
- Đảo thứ tự DOM, dựng lại đích sau drop, thay hậu tố ID thẻ và dùng keyboard fallback: đạt.
- Ví dụ sai, thiếu ô, thiếu thẻ, ID ô trùng, khay không liên quan và sự kiện bị trang bỏ qua không được báo là thành công.
- Hồi quy `tests/header-skill.cjs`: Grammar 7.1 Ex 5A nhận/điền năm ô và từ chối nhầm trang: đạt.

Test tự chứa fixture, không phụ thuộc file chẩn đoán trong Downloads. Chạy bằng Node với Playwright có sẵn, đặt MEL_TEST_BROWSER nếu cần: `node tests/picture-labels.cjs`.

## Giới hạn

Lần này chỉ có ảnh, chưa có DOM chẩn đoán của bài 7.1 Ex 6. Fixture dùng nội dung/ô ví dụ trong ảnh và cấu trúc response-series đã được quan sát ở những bài kéo nhãn trước; handler mô phỏng. Chưa xác minh Pearson thật dùng đúng cấu trúc này hoặc đã lưu/chấm. Nếu widget thực khác, cần xuất chẩn đoán để đối chiếu.

Seed SHA256 giữ nguyên: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
