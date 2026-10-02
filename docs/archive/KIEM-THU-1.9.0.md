# Kiểm thử 1.9.0 — sắp xếp thẻ từ

Ngày 2026-09-29. Nền v11, seed study giữ nguyên. Nguồn cấu trúc: file `myenglishlab-keo-tha-chan-doan (3).json` người dùng cung cấp. Không có nhánh đặc biệt theo ID bài hoặc số câu trong adapter.

## Kết quả

Đã chạy bằng Edge headless và extension MV3 thật trên trang kiểm thử; jQuery UI Sortable sử dụng thư viện thật, ứng dụng kiểm thử ghi nhận đáp án qua sự kiện receive/update. HTML5 có handler riêng và dữ liệu đáp án được kiểm tra độc lập với thông báo của extension.

- `work/test-ordering-drag.cjs`: 5 câu, 35 thẻ, khay/đích trùng ID, thứ tự các câu đảo; model nhận đủ 5 đáp án, ví dụ không đổi, không Submit. Chạy lần hai giữ 5 câu đúng.
- Tiếp tục câu đã có 2 từ đúng: chỉ kéo 33 từ còn lại. Câu đã đặt sai được giữ và báo chưa hoàn tất; 4 câu khác vẫn được làm.
- HTML5 với phần tử câu được thay mới sau mỗi drop vẫn hoàn tất 5 câu. Trang bỏ qua sự kiện thì không báo thành công. Sortable không kết nối thì từ chối và không bật picker nhập ô.
- Dừng, đổi tiêu đề Exercise, và chỉ làm một câu: đạt.
- `work/test-ordering-edge.cjs`: thẻ có từ lặp trong cùng câu, khay/vùng nhận hẹp xuống dòng; từ lặp được dùng đủ số lượng. Hai câu có bộ từ giống nhau hoặc thiếu một từ thì từ chối, không kéo.
- `work/test-ordering-detect.cjs`: nhận bài theo các khay từ, từ chối bài mơ hồ, giữ thông báo chưa hỗ trợ cho cấu trúc chưa biết, kiểm tra xuất chẩn đoán và không bật picker khi trang không có ô phù hợp: đạt.
- Hồi quy `work/test-auto-fill.cjs`: tự điền, hàng đợi, iframe, đổi bài, sửa giá trị và giữ ví dụ: đạt.
- Hồi quy `work/test-auto-drag.cjs`: jQuery UI draggable, HTML5, đích được thay mới, từ đã điền, hủy, iframe và kéo hình có nhãn: đạt.
- Hồi quy `work/test-letters.cjs`: 13 đáp án menu trên 3 cấu trúc ô ký tự, giữ chữ gợi ý, điền cả cụm khi bấm một ô, từ chối mẫu sai: đạt.

## Giới hạn xác minh

Chưa chạy trực tiếp trên phiên Pearson của người dùng. JSON chứng minh cấu trúc DOM và sự hiện diện thư viện; không chứa toàn bộ handler/cấu hình Sortable. Adapter kiểm tra instance khi chạy, xác minh thứ tự trên DOM và báo lỗi nếu trang không nhận thao tác. Không khẳng định Pearson đã lưu hoặc chấm đáp án. Không tự Save/Submit.

Chỉ hỗ trợ một thẻ tương ứng một từ trong kiểu khay/câu đã xác định. Câu đang có phần đầu sai thứ tự cần đưa thẻ về khay trước khi chạy lại; không tự xóa đáp án đã có. Các widget sắp xếp khác vẫn cần bổ sung bằng chứng cấu trúc.

Seed SHA256: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
