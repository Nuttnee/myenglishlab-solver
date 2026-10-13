# Tìm từ trong bảng chữ — 9.2 Ex 1A

## Tự chọn hai đầu từ — 1.14.12

File chẩn đoán mới từ bản 1.14.11 đã thu được DOM thật: `.wordsearchGrid[role=grid]`, `.wordsearchGridRow[role=row]`, `.wordsearchItem[role=gridcell]`, trạng thái `.active` và `.wordsearchAnswersList > li.example`. Có 72 ô, chỉ `features` nằm trong danh sách kết quả. Fixture `tests/fixtures/word-search-grid.html` giữ cấu trúc, thuộc tính điều khiển và chữ từ vùng này, không chứa URL hay dữ liệu tài khoản.

Adapter xác minh một bảng duy nhất, hàng/cột đều và đúng vị trí hiển thị. Tìm đường thẳng theo tám hướng từ chính các chữ trên trang; mỗi đáp án phải có đúng một đường. Đối chiếu ví dụ, danh sách từ và toàn bộ ô active trước khi chạy. Không dùng số câu, lesson ID hoặc tọa độ cố định để chọn ô.

Mỗi từ dùng hai lần `click()` vào chữ đầu và cuối. Chỉ tính thành công khi danh sách kết quả tăng đúng từ cần chọn và tập ô active khớp các từ đã ghi nhận. Giữ từ đã có và ví dụ, hỗ trợ làm riêng một câu. Dừng khi không có xác nhận, từ lạ, từ trùng, chọn dở, lưới/endpoint bị thay hoặc người dùng bấm Dừng. Không đổi DOM để giả lập đáp án và không tự Save/Submit.

`tests/word-search.cjs` nạp MV3 trên Edge với fixture DOM thật và handler mô phỏng độc lập: chọn đủ từ, giao nhau, giữ PARK đã có, chạy lại không bấm thêm, làm riêng PARK, trang bỏ qua click hoặc thêm sai từ, từ lạ/chọn dở, thiếu từ, nhiều bảng, đường mơ hồ, hủy giữa hai chữ và thay endpoint. `tests/word-search-diagnostic.cjs` tiếp tục kiểm tra bộ xuất và từ chối widget chưa biết. Hồi quy checkbox và chẩn đoán đoạn văn đạt.

Handler chọn từ vẫn là mô phỏng, không phải mã Pearson. Kết quả kiểm thử xác nhận adapter và kiểm tra DOM; cần người dùng thử bản mới trên phiên Pearson để xác nhận widget thật nhận sự kiện.

## Lịch sử: chẩn đoán ở 1.14.11

Ảnh người dùng cung cấp có bảng 8 hàng × 9 cột, từ `features` là ví dụ; hướng dẫn yêu cầu bấm chữ đầu và chữ cuối. File chẩn đoán từ bản 1.14.10 nhận đúng tiêu đề nhưng các vùng cấu trúc và điều khiển đều trống. Ảnh không cho biết DOM hoặc sự kiện của widget.

Ở bản 1.14.11, thay đổi chỉ bổ sung thu thập đọc và thông báo chưa hỗ trợ tự chọn từ. Không suy đoán selector hoặc cơ chế chọn trên Pearson từ ảnh. Cần file chẩn đoán mới, tốt nhất sau khi người dùng chọn thử một từ, để triển khai adapter và xác minh trạng thái.

## Bộ xuất chẩn đoán 1.14.11

- `lib/word-search.js` chỉ chạy khi hướng dẫn có word square/word search và first/last letter. Tìm nhóm chữ đơn hiển thị, loại trùng wrapper lồng nhau, lấy vùng kết quả gần bảng.
- Xuất cây node giới hạn kích thước, chữ, lớp CSS, thuộc tính theo danh sách cho phép, tọa độ tương đối và kiểu hiển thị. Bỏ giá trị form, URL, inline handler, vùng ẩn và thanh điều hướng. Giới hạn này áp dụng cho phần `controls.wordSearch` mới.
- `MEL_DRAG_DIAGNOSTIC` thu dữ liệu qua content script. `MEL_AUTO_SOLVE` trả `word-search-unresolved`, không dùng cơ chế điền ô dự phòng.
- Giao diện vô hiệu hóa nút tự làm và ẩn chế độ bấm ô lần lượt/điền từng câu cho dạng tìm từ; vẫn cho xem và sao chép đáp án.
- Không thay đổi `data/seed.json` hoặc kho người dùng.

## Kiểm thử bộ xuất chẩn đoán

`node tests/word-search-diagnostic.cjs` nạp extension MV3 thật trong Edge, dùng trang tái hiện với 72 chữ từ ảnh và DOM tổng hợp. Kiểm tra 72 ô lồng nhau, nhãn hàng/cột, tọa độ, danh sách `features`, lớp trạng thái sau một lần bấm thủ công trong test, loại bỏ chuỗi đánh dấu nhạy cảm và không tự bấm/Save/Submit. Bài khác không thu vùng bảng chữ. Có thể đặt `MEL_TEST_EXTENSION` để chạy cùng kiểm thử trên ZIP đã giải nén.

Hồi quy: `tests/checkbox-states.cjs`, `tests/passage-widgets.cjs`.

Đây là kiểm thử bộ xuất chẩn đoán trên trang tái hiện, chưa phải kiểm chứng thao tác chọn từ trên Pearson. Bảng vẽ bằng canvas hoặc chữ không có trong DOM vẫn có thể chưa thu được.
