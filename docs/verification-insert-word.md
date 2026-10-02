# Chèn từ vào câu khi rê chuột

Ngày: 2026-10-02. Manifest nội bộ: 1.13.0.

## Bằng chứng và phạm vi

Ảnh và JSON người dùng xác nhận 8.2 Writing: adding emphasis, Exercise 3A, Activity 2520697175. Cây DOM có `.insertAWord .sentence` chứa các `.switcher[role=button]`; ví dụ không có role tương tác. Người dùng xác nhận rê chuột làm hiện ô nhập.

JSON cũ bỏ qua input và câu ngắn “It sounds good. (really)”. Fixture `insert-word-observed.json` giữ nguyên các cây quan sát được. Kiểm thử dựng lại các cây này, bổ sung câu ngắn, ô ẩn và handler hover mô phỏng. **Chưa có DOM ô nhập thật sau hover, chưa chạy trên phiên Pearson thật hoặc xác nhận lưu/chấm điểm.** Nếu Pearson chỉ dùng CSS `:hover` hoặc yêu cầu sự kiện chuột thật, thao tác tổng hợp có thể không hiện được ô; adapter báo lỗi thay vì tính là đã điền.

## Quy tắc

- Ghép toàn bộ câu, từ trong ngoặc và một khoảng trống trong prompt. Không đoán vị trí từ số câu hoặc hint.
- Hover hai bên khoảng trống nếu cần, đọc lại ô input, xác minh nội dung trước/sau ô mới ghi. Không tự tạo ô hoặc ép CSS hiển thị.
- Kiểm tra giá trị và vị trí sau input/change/blur và sau khi rời điểm hover. Giữ nguyên ví dụ, đáp án đã đúng, ô có nội dung khác hoặc từ đã điền ở vị trí khác.
- Dừng khi trang đổi, ô không hiện, câu/ô không duy nhất hoặc giá trị bị trang xóa. Không Save/Submit.
- Không để ô insertion đi qua bộ ghép ô native thông thường. Giao diện có nút riêng **Tự chèn từ đúng vị trí**, cả bài hoặc từng câu.
- Chẩn đoán riêng thu vị trí ô ẩn và trạng thái hiển thị/khóa, không thu giá trị người dùng đã nhập. Seed giữ nguyên; catalog chỉ bổ sung section, exercise và Activity ID, giữ tên chủ đề nguồn `Writing: adverbs`.

## Kiểm thử

`node tests/insert-word.cjs` chạy extension MV3 trong Edge với các trường hợp:

- Ba từ really / fairly / extremely đúng khoảng trống; giữ very ví dụ; chạy lại bỏ qua từ đã đúng.
- Input đứng trước hoặc sau nội dung switcher; câu không đánh số và bị đảo thứ tự; chỉ làm một câu.
- Hover không phản hồi, input bị từ chối, rời chuột làm mất giá trị, đổi bài trong lúc chạy: dừng và không báo thành công.
- Giữ nội dung cũ, không thêm bản sao khi từ nằm sai vị trí; từ chối câu hoặc ô trùng lặp; từ chối Ex 3B.
- Báo cáo chứa vị trí input ẩn, không chứa giá trị; không có native fallback hoặc Save/Submit.

Hồi quy: `inline-choices.cjs`, `single-reading-choice.cjs`, `unknown-widgets.cjs` đạt.
