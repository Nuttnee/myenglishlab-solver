# Kiểm thử 1.9.2 — kéo nhãn vào hình

Ngày 2026-09-29. Cấu trúc thật lấy từ `myenglishlab-keo-tha-chan-doan (4).json`: bốn ô `.drop` trong `.droppableWrapper`, `i_1RESPONSE_1` đến `_4`, ô đầu `.example` chứa paragraph 4; khay `wordpoolWrapperi_1` chứa ba thẻ draggable và một ví dụ disabled. Context không có chữ A–D.

## Quy tắc bổ sung

Đối chiếu chuỗi mã ô liên tiếp với các hàng Picture A… khi đủ bộ đáp án và ví dụ cố định khớp. Đây là suy luận cấu trúc có điều kiện, không phải đọc chữ trong ảnh. Không dùng data-id thẻ làm khóa đáp án, không gắn quy tắc với lesson ID hoặc Activity ID, không dựa vào thứ tự ô trống. Mã ô được dùng để giữ đúng liên kết khi DOM đảo vị trí.

HTML5 đi qua event handler trang và xác minh đáp án sau khi thả. Nếu HTML5 không đổi trang, keyboard fallback cho region không tabbable có thể thêm tabindex=-1 tạm để focus; khôi phục thuộc tính sau đó. Không ghi đáp án trực tiếp vào DOM/model.

## Kết quả

`work/test-picture-response.cjs`:

- Tái dựng thuộc tính nguồn/đích từ JSON thật. Bản 1.9.1: 0 ghép; bản mới: 3 thao tác HTML5 được handler nhận, model B=paragraph 3, C=paragraph 1, D=paragraph 2. A=paragraph 4 và khay từ không bị kéo. Không Submit.
- Chạy lại: giữ ba đáp án đúng, không thao tác thừa.
- Đảo thứ tự DOM và thay mới đích sau drop: vẫn ghi đúng mã ô.
- Handler chỉ nhận bàn phím: điền đúng ba ô, bỏ tabindex tạm, không phát mousedown kéo khay.
- Handler bỏ qua thao tác: không báo thành công.
- Thiếu ô, thiếu từ, ví dụ sai, khay sai, trùng ID, thiếu dấu ví dụ hoặc nhãn cục bộ mâu thuẫn: tắt suy luận chuỗi mã. Ghép dựa trên nhãn rõ ràng, nếu có, vẫn độc lập.
- Đáp án khác đã có ở B: giữ nguyên và báo còn một ô, hoàn thành C/D.
- Edge + extension MV3 thật: tự nhận bài 5A; bấm Tự làm cả bài ghi đủ B/C/D bằng handler trang kiểm thử.

Hồi quy đạt:

- `work/test-auto-drag.cjs`: jQuery UI draggable, HTML5, ví dụ, nguồn đã điền, đích thay mới, hủy, iframe, kéo hình có nhãn, không Submit.
- `work/test-general-routing.cjs`: ghép câu, dropdown, checkbox nhiều lựa chọn, phân loại vào nhóm, từ chối đích trùng.
- `work/test-diagnostic-regression.cjs`: các lớp drop/droppable/drop-target; bài 6.1 từ chẩn đoán cũ; keyboard fallback; không kéo cả khay từ.

## Phạm vi xác minh

Chưa thực thi trên phiên Pearson thật của người dùng. JSON xác nhận cấu trúc nhưng không chứa mã event handler. Kiểm thử dùng handler mô phỏng và model riêng kiểm tra các sự kiện/đáp án; chưa xác nhận Pearson đã lưu hoặc chấm. Không tự Save/Submit. Các widget không thỏa điều kiện chuỗi mã/ví dụ vẫn báo chưa ghép chắc chắn.

Kho đáp án không đổi; SHA256 seed: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
