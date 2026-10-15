# R3 Exercise 12 — category boxes

Chẩn đoán 1.14.25 ngày 2026-10-15 nhận đúng `ta2-u9-r3-ex12`, tìm được nguồn nhưng targets rỗng, 14 mục chưa ghép. DOM có `.categorisationBox > .boxTitle` và `.boxBody[role=region][aria-label="Drop items here"]`; không có class drop ở body, tiêu đề là sibling nên bộ nhận ô/nhãn cũ bỏ qua. Các token riêng là HTML5 draggable; ui-draggable thuộc khay, không phải thẻ.

`lib/drag.js` bổ sung nhận cấu trúc này, lấy tên từ title trực tiếp duy nhất. Với hộp mới, toàn bộ nhóm phải khớp đáp án, không trùng tên, các cặp ví dụ phải đúng. Ô usable mới được dùng. Bộ HTML5 hiện có kéo từ nguồn tới body, xác nhận theo thẻ trong đích; không sửa DOM trực tiếp. Không đổi seed hoặc catalog và không phân nhánh theo ID bài.

`tests/fixtures/category-boxes-observed.json` giữ bằng chứng widget đã lọc, không có URL/account/frame metadata hay mã handler. `tests/category-boxes.cjs` dùng nhãn/roles/classes từ chẩn đoán, mô phỏng handler HTML5 và kiểm tra model riêng.

Đạt source và ZIP giải nén: 14 từ, nhóm đã chứa nhiều thẻ vẫn nhận, giữ fresh air (Example), chạy lại không kéo thêm, đổi thứ tự nhóm, làm riêng dolphin rồi tiếp tục 13 từ; từ chối nhãn nhóm thiếu/trùng, ví dụ sai nhóm, đích khóa, drop không được nhận và header khác; không Save/Submit hoặc sửa kho lưu. Hồi quy outdoors-collocations và inline-drag-blanks đạt. Chưa kiểm chứng handler/lưu/chấm trên phiên Pearson thật.
