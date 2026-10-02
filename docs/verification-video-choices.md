# Nhận bài từ các nhóm lựa chọn

2026-10-02 — Unit 7 · Changes · Exercise 3.

Kho study đã có sáu cặp câu, gồm ví dụ, tại `ta2-u7-x-exx-i233`. Mỗi prompt được ghi trọn trong ngoặc `(lựa chọn A / lựa chọn B)`. Bộ nhận diện nội dung cũ xóa phần trong ngoặc như chú thích, nên không có bằng chứng để nhận bài. Test mới xác nhận bản trước sửa không tìm được bài.

## Thay đổi

- Thu thập lựa chọn theo từng nhóm radio trên trang, giữ nguyên ranh giới câu.
- Đối chiếu toàn bộ lựa chọn trong mỗi nhóm, không phụ thuộc thứ tự, số câu hoặc Activity ID. Dấu ngoặc bao toàn bộ cặp lựa chọn được coi là nội dung.
- Yêu cầu ít nhất ba nhóm khác nhau và ít nhất 75% các nhóm đủ điều kiện của nguồn; không nhận từ đáp án riêng lẻ. Từ chối các ứng viên đồng hạng.
- Bổ sung metadata Changes / Exercise 3 / Activity 2520693200 trong catalog từ ảnh người dùng. Không suy đoán section 7.4; ảnh chỉ ghi Unit 7.
- Cơ chế tự chọn radio hiện có tiếp tục đối chiếu nhãn đáp án; giữ câu ví dụ. Không sửa seed hoặc đáp án.

## Kiểm thử

`tests/video-choices.cjs` chạy Edge với extension MV3 thật và trang HTML dựng từ ảnh:

- Nhận bài trong toàn bộ kho mà không có catalog hoặc Activity ID; nhận cả bài giả lập dùng nội dung khác theo cùng quy tắc.
- Từ chối kho có hai bài trùng, chỉ hai nhóm khớp, chỉ có đáp án đúng, lựa chọn bị ghép chéo giữa các câu hoặc có lựa chọn thừa. Chấp nhận dấu nháy cong.
- Tự nhận với kho đã lưu và Activity ID chưa biết, chọn đúng năm câu 2–6, giữ ví dụ 1. Không Save/Submit.
- Đảo câu, đảo lựa chọn, bỏ số câu vẫn chọn đúng theo nhãn.
- Khi đổi sang Exercise 4, từ chối điền bằng đáp án Exercise 3.

Hồi quy: `header-skill.cjs`, `dialogue-blanks.cjs`, `review-detection.cjs` và fixture `work/test-general-routing.cjs` (ghép nghĩa, dropdown, checkbox, kéo vào nhóm).

Giới hạn: kiểm thử trên DOM/handler mô phỏng theo ảnh, chưa xác nhận thao tác hoặc lưu/chấm trên Pearson thật.
