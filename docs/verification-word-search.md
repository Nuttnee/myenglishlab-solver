# Chẩn đoán bảng tìm từ — 9.2 Ex 1A

## Bằng chứng và giới hạn

Ảnh người dùng cung cấp có bảng 8 hàng × 9 cột, từ `features` là ví dụ; hướng dẫn yêu cầu bấm chữ đầu và chữ cuối. File chẩn đoán từ bản 1.14.10 nhận đúng tiêu đề nhưng các vùng cấu trúc và điều khiển đều trống. Ảnh không cho biết DOM hoặc sự kiện của widget.

Vì vậy thay đổi này chỉ bổ sung thu thập đọc và thông báo chưa hỗ trợ tự chọn từ. Không suy đoán selector hoặc cơ chế chọn trên Pearson từ ảnh. Cần file chẩn đoán mới, tốt nhất sau khi người dùng chọn thử một từ, để triển khai adapter và xác minh trạng thái.

## Thay đổi

- `lib/word-search.js` chỉ chạy khi hướng dẫn có word square/word search và first/last letter. Tìm nhóm chữ đơn hiển thị, loại trùng wrapper lồng nhau, lấy vùng kết quả gần bảng.
- Xuất cây node giới hạn kích thước, chữ, lớp CSS, thuộc tính theo danh sách cho phép, tọa độ tương đối và kiểu hiển thị. Bỏ giá trị form, URL, inline handler, vùng ẩn và thanh điều hướng. Giới hạn này áp dụng cho phần `controls.wordSearch` mới.
- `MEL_DRAG_DIAGNOSTIC` thu dữ liệu qua content script. `MEL_AUTO_SOLVE` trả `word-search-unresolved`, không dùng cơ chế điền ô dự phòng.
- Giao diện vô hiệu hóa nút tự làm và ẩn chế độ bấm ô lần lượt/điền từng câu cho dạng tìm từ; vẫn cho xem và sao chép đáp án.
- Không thay đổi `data/seed.json` hoặc kho người dùng.

## Kiểm thử

`node tests/word-search-diagnostic.cjs` nạp extension MV3 thật trong Edge, dùng trang tái hiện với 72 chữ từ ảnh và DOM tổng hợp. Kiểm tra 72 ô lồng nhau, nhãn hàng/cột, tọa độ, danh sách `features`, lớp trạng thái sau một lần bấm thủ công trong test, loại bỏ chuỗi đánh dấu nhạy cảm và không tự bấm/Save/Submit. Bài khác không thu vùng bảng chữ. Có thể đặt `MEL_TEST_EXTENSION` để chạy cùng kiểm thử trên ZIP đã giải nén.

Hồi quy: `tests/checkbox-states.cjs`, `tests/passage-widgets.cjs`.

Đây là kiểm thử bộ xuất chẩn đoán trên trang tái hiện, chưa phải kiểm chứng thao tác chọn từ trên Pearson. Bảng vẽ bằng canvas hoặc chữ không có trong DOM vẫn có thể chưa thu được.
