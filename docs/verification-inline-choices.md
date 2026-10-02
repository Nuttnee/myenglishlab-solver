# Tự chọn từ trong câu

2026-10-02 — kiểm tra từ JSON người dùng của 8.1 Grammar: relative clauses, Exercise 3.

## Cấu trúc đã quan sát

File chẩn đoán 1.11.9 có mười câu `.itemContent.singleUnderline` trong `LI.item`. Mỗi câu có `.underlineGroup.single` và hai con `.underlineElement`. Câu mẫu có `.example` và từ `who.selected` gạch chân; không có nút tương tác. Các câu còn lại có `role=button`, `tabindex=0`, `aria-pressed=false` trên từng từ. File này chưa có lựa chọn chủ động ở câu 2; trạng thái chọn cần được kiểm tra khi chạy.

Fixture `tests/fixtures/inline-choices-observed.json` giữ riêng cây câu hỏi đã quan sát, không chứa URL/account metadata. Kiểm thử tái tạo thẻ, class, thuộc tính và thứ tự text từ fixture; handler click mô phỏng riêng và không phải mã Pearson.

## Quy tắc

- Nhận nhóm `.underlineGroup.single` có từ con `role=button` và `aria-pressed=true/false`. Không coi mọi span hoặc mọi nút trên trang là đáp án.
- Coi nhóm là một lựa chọn duy nhất, dùng bộ ghép câu và đáp án hiện có; không có nhánh theo ID/Unit/Exercise.
- Bấm qua `.click()` để trang xử lý. Không tự thêm class selected, gạch chân hay sửa `aria-pressed`.
- Chỉ xác nhận hoàn tất khi từ đích vẫn trên trang, `aria-pressed=true` và không có từ thứ hai trong nhóm đang được nhấn. Nếu Pearson không cập nhật trạng thái thì dừng và báo chưa nhận thao tác.
- Bỏ qua ví dụ, nhóm bị khóa hoặc không đủ cấu trúc; không bấm lại lựa chọn đã đúng. Có thể sửa lựa chọn sai trước đó như đối với radio.
- UI hiện **Tự chọn từ cả bài**. Kho study và đáp án gốc giữ nguyên.

## Kết quả

`tests/inline-choices.cjs` chạy extension MV3 trong Edge:

- Chọn đủ chín câu, giữ `who` mẫu, không Save/Submit; chạy lại không phát thêm click.
- Đảo câu và bỏ số câu vẫn ghép theo nội dung. Nút từng câu sửa đáp án cũ sai.
- Handler bỏ qua click, chỉ đổi kiểu hiển thị hoặc đặt cả hai lựa chọn thành pressed: không báo thành công, dừng sau lần bấm đầu.
- Câu trùng gây mơ hồ, nhóm multiple chưa được hỗ trợ, hoặc đổi Exercise: không bấm đoán.
- Hồi quy: bài video radio, ô nhập Grammar, chẩn đoán unknown widget; fixture ghép nghĩa/dropdown/checkbox/category vẫn đạt.

Chưa chạy trên phiên Pearson thật hoặc kiểm chứng lưu/chấm phía máy chủ. Cấu trúc DOM là dữ liệu thật; việc phản hồi click trong kiểm thử là mô phỏng. Bộ xử lý chỉ hỗ trợ nhóm chọn một từ có cấu trúc trên, không suy rộng sang chọn nhiều âm tiết/từ.
