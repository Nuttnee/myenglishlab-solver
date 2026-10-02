# Bàn giao sửa theo khảo sát · 1.8.0

Đầu vào: report.md, coverage.json và fixtures đi kèm tại C:/Users/User/Downloads/Myenglish/khao-sat-dieu-khien. Không sửa các tài nguyên khảo sát. Phân biệt phát hiện từ DOM người dùng với cơ chế giả lập; chưa xác minh các giả thuyết thành cơ chế Pearson thật.

## Đã xử lý

| Phát hiện | Thay đổi | Bằng chứng |
|---|---|---|
| A lot/I bị đọc thành chữ câu; số dính chữ | Context đọc text node và ol/li có ngữ nghĩa | f13 cả bài + chỉ A: không điền sai ô; f03 đủ 5 T/F |
| Một ô mơ hồ chặn cả bài | Worker áp dụng phần ghép được, báo câu còn thiếu | f02 ambiguous/custom: 3 câu đúng, giữ câu 5 |
| Suy đoán thứ tự vượt mốc cuối | Chỉ lấp khoảng giữa các mốc | f08 không số: làm 1–3, giữ 4–5 |
| Từ trùng không kéo được | Token văn bản cùng chữ trong word bank có thể thay thế | f08 có số làm đủ 5 |
| Kéo nhiều từ vào nhóm bị mất đích | Giữ nhận diện nhóm có heading khi chứa nhiều token | f10 đủ 5 từ |
| HTML5 thất bại làm di chuyển word pool | Không thử chuột trên token HTML5 chỉ vì cha có ui-draggable | f07 trusted và handle=0: hộp không di chuyển, báo chưa làm được |
| Checkbox còn distractor đã tích sai | Nhận nhóm và chỉ xóa lựa chọn thừa trong nhóm ghép đủ | f05 có/không số; test nhóm khác cùng số không bị xóa |
| Có nguồn nhưng không nhận đích | Phân loại chưa nhận diện và xuất cấu trúc, không picker input | f07 opaque; kiểm thử worker/UI |
| Bài ít chữ không qua nhận diện | Chọn thủ công gắn với trang; dùng Activity ID nguồn duy nhất nếu tương thích | Kiểm thử worker/UI và đổi trang/tiêu đề |
| Chẩn đoán xuất toàn trang | Bỏ questionText, giới hạn ngữ cảnh, che Activity ID và bỏ query/hash | Canary ngoài bài không có trong JSON; giữ cấu trúc ô và pseudo-element |
| DOM đổi chưa chứng minh app nhận | Thêm verification=dom-only và thông báo chưa xác nhận lưu | f01 chỉ nghe keyup vẫn chưa ghi app; không tuyên bố đã lưu |

## Chưa xử lý xong

- Đích opaque có placeholder CSS: đã chẩn đoán được, chưa tự kéo vào đó. Cần markup đích thật và cách widget đăng ký drop để viết adapter tổng quát.
- Input chỉ ghi app khi keyup; radio mousedown-only hoặc hidden không label: cần quan sát chuỗi event/điều khiển thật trước khi bổ sung.
- Custom listbox và đáp án chữ/option chữ cái: cần bảng nhãn–giá trị–nội dung lựa chọn và trạng thái mở/đóng/đã chọn.
- Bấm từ/âm tiết/khoảng cách/hình, kéo sắp xếp, nối nét, lưới chữ: chưa có adapter thực thi tổng quát.
- Widget chỉ nhận isTrusted: cơ chế sự kiện tổng hợp hiện tại không đáp ứng; không thêm quyền debugger trong bản này.
- Có native lẫn widget chưa hỗ trợ trong cùng bài: xử lý được phần native ghép chắc chắn, phần còn lại vẫn cần cơ chế tương ứng.

## Tài nguyên cần cho vòng tiếp theo

Theo mỗi họ điều khiển còn thiếu, lấy một bài đại diện và một biến thể ở Unit khác: ảnh toàn bài, JSON diagnostic 1.8.0, phần DOM cục bộ của câu/nguồn/đích/lựa chọn trước và sau một thao tác tay, cùng dấu hiệu app đã ghi nhận. Cần thuộc tính, nhãn, nhóm, pseudo-element và sự kiện tương tác; ảnh đơn thuần không xác định được cơ chế nhận dữ liệu.

Giữ report.md/coverage.json làm danh sách họ bài; cập nhật trạng thái theo bằng chứng mới. Không dùng số bài trong seed hay ảnh report để kết luận mọi bài trong họ đã hoạt động. Khi có DOM thực, sửa adapter theo cấu trúc và thêm fixture cho cả họ, không thêm nhánh theo từng lesson ID.
