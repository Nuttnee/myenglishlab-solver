# Kiểm thử 1.10.1 — kéo câu theo thứ tự

Ngày 2026-09-29. Nguồn: JSON chẩn đoán (6), bài Fitness Ex 3. Sáu thẻ câu, một ví dụ disabled, sáu ô `.drop` mã RESPONSE_1…6, chung `.droppableWrapper .dndlh`. Không có nhóm `draggableJumbledWords`. Kho lưu câu ở prompt, số thứ tự ở answer.

## Thay đổi

Chọn adapter theo cấu trúc trang thay vì chỉ type=ordering. Dạng thẻ cả câu sử dụng adapter kéo thả với đối chiếu chuỗi RESPONSE; prompt là thẻ nguồn, answer là thứ hạng. Các thứ hạng phải duy nhất, liên tục và có bộ thẻ/ví dụ khớp. Không chỉnh seed; không suy đáp án từ data-id thẻ. Nút chính là Tự xếp câu theo thứ tự.

## Kiểm thử đạt

`work/test-sentence-ranking.cjs` dùng Edge và extension MV3 thật, fixture dựng thuộc tính theo JSON (6), handler HTML5/keyboard mô phỏng và model ứng dụng độc lập:

- Tự nhận đúng bài theo nội dung, nút tự xếp câu ghi cả câu vào năm đích 2–6 theo thứ hạng. Ô ví dụ 1 không đổi, không kéo khay, không Submit.
- Chạy lại giữ năm ô đúng; báo đã đúng thay vì kéo lại.
- Đảo DOM đích, thay mới đích sau drop, thay toàn bộ hậu tố data-id thẻ vẫn cho cùng kết quả.
- Thay thứ tự mảng bài và thay n thành chữ cái: đích vẫn lấy từ answer, không từ n hoặc vị trí hàng.
- Keyboard-only handlers: đạt.
- Thiếu ô, thiếu thẻ, ví dụ sai, trùng ID đích hoặc trùng thứ hạng: không kéo và không chuyển sang picker nhập ô.
- Trang không nhận sự kiện: không tính thành công. Ô có câu khác: giữ nguyên, hoàn tất bốn ô còn lại và báo thiếu một.
- Chỉ làm một câu và hủy giữa chừng: đạt.

Hồi quy:

- `work/test-picture-response.cjs`: ba nhãn vào hình B/C/D, ví dụ A, kiểm tra nhóm/mã ô/khay, HTML5 và keyboard, từ chối cấu trúc sai, UI thật: đạt.
- `work/test-ordering-drag.cjs`: năm câu / 35 từ qua jQuery UI Sortable, câu điền dở, ví dụ, từ chối sai thứ tự, HTML5, hủy/đổi trang/chỉ một câu: đạt.
- `work/test-ordering-detect.cjs`: khay từ với cấu trúc chưa hỗ trợ vẫn báo rõ; không bật picker trên trang chỉ kéo thả; nhận bài mơ hồ bị từ chối: đạt.

## Giới hạn

Chưa thao tác trên phiên Pearson thật của người dùng. JSON xác nhận markup, không cung cấp handler gốc; fixture sử dụng handler mô phỏng để xác minh điều phối và nội dung sự kiện. Trạng thái DOM đúng không xác nhận Pearson đã lưu hoặc chấm. Quy tắc này yêu cầu một thẻ ứng với một câu, thứ hạng 1…N, bộ thẻ đầy đủ và ví dụ cố định. Cấu trúc khác tiếp tục báo chưa ghép chắc chắn.

Seed SHA256: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021` (không đổi).
