# Kiểm thử 1.10.2 — nhận bài nối cặp và thu cấu trúc widget

Ngày 2026-09-29. Nguồn: ảnh Fitness Ex 7 và JSON (7), lesson ta2-u6-x-exx-i198, Activity 2518629560. JSON không chứa input, nguồn/đích kéo thả hoặc cấu trúc nút nối. Ảnh xác nhận hai cột nối đường kẻ, một cặp ví dụ take (that) up → start doing.

## Phạm vi hoàn thành

- Bổ sung metadata xác minh Unit 6 / Fitness / Ex 7 và Activity ID. Không sửa đáp án hoặc seed.
- Quy tắc chung nhận matching bằng cả hai vế của ít nhất ba cặp, tối thiểu 75% số cặp; kiểm tra mơ hồ và tiêu đề trái nhau. Không bỏ từ trong ngoặc.
- Chẩn đoán mới đọc ứng viên endpoint theo chữ, ancestor và cấu trúc vùng có thể nối, tọa độ, ID/lớp/trạng thái, SVG/canvas, tên event và selector jQuery. Không xuất mã handler, model ứng dụng hoặc giá trị input riêng tư. Không bấm hay ghi DOM trong bộ thu mới.
- UI không khẳng định mọi bài matching không có input là kéo thả; lỗi chỉ rõ chưa hỗ trợ điều khiển nối và vị trí nút xuất file.

## Kiểm thử đạt

`work/test-connections-diagnostic.cjs`: Edge với extension MV3 thật và kho cũ. Nhận đúng Fitness Ex 7, ID sai số bài bị từ chối; nội dung hai vế nhận được khi không có ID; trùng bài, chỉ một cột hoặc quá ít cặp không đủ để nhận. Seed và kho đã lưu không đổi.

Fixture DIV/SVG **tự dựng để kiểm tra bộ thu**, không phải HTML Pearson: thu đủ 10 endpoint, giữ take (that) up, có cấu trúc cha, data-id, SVG path, inline event và delegated jQuery event. Vẫn xuất vùng khả nghi khi chưa chọn bài. Không lộ các giá trị mật khẩu/email/hidden hoặc data-session của fixture. Không kích hoạt click/mousedown; nút tự làm trả unresolved, không báo thành công hoặc bật picker.

Hồi quy đạt: `test-reading-5a.cjs` (metadata/kho cũ/tiêu đề mâu thuẫn), `test-general-routing.cjs` (6C, dropdown, checkbox, phân loại), `test-sentence-ranking.cjs` (xếp cả câu, ví dụ, đảo DOM, thiếu/thừa cấu trúc, keyboard, hủy).

## Chưa hoàn thành

**Chưa triển khai hoặc xác minh tự nối đường kẻ.** Cần JSON xuất bằng bản 1.10.2 trên Fitness Ex 7 để xác định cấu trúc thật. Chưa có bằng chứng giao thức thao tác và cách đọc lại cặp đã nối. Không tự click hai phần tử chỉ vì chúng trùng chữ. Không thao tác phiên Pearson thật, Save hay Submit.

Bộ thu có giới hạn kích thước; không lấy nội dung pixel của canvas, mã nguồn handler hoặc listener addEventListener không lộ qua jQuery/inline. Các trường này không có nghĩa mọi widget đã được mô tả đầy đủ.

Seed SHA256: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
