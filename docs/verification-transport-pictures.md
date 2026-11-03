# 5.1 Exercise 4A — Tim Bobo pictures

Ảnh ngày 2026-11-03 xác nhận Exercise 4A; panel ghi 5.1 Grammar: past simple and past continuous. Nguồn `ta2-u5-5.1-exx-timbobo-pictures` có sáu đáp án đúng nhưng thiếu số bài và chưa có thứ tự hình được xác minh. Hai cột, ba hàng: 1 drop his ticket (ví dụ), 2 pay the taxi driver, 3 go through security, 4 go for a walk, 5 try to sleep, 6 decide to use his mobile phone.

Chỉ bổ sung catalog: exercise 4A và pictureLayout với snapshot câu nguồn. Dùng lại enrichCatalog và responseSeries hiện có. Nếu người dùng sửa câu/đáp án thì không áp dụng bố cục bổ sung. Không đổi seed, kho lưu, adapter hoặc thêm phụ thuộc.

`tests/transport-pictures.cjs` dùng MV3 Edge, đáp án fixture khai báo độc lập, response-series và handler HTML5/keyboard mô phỏng. Kiểm tra nhận bài từ header không cần activity ID; từ chối header mâu thuẫn, bài trùng và metadata người dùng đã sửa. Kiểm tra năm nhãn, giữ ví dụ, chạy lại không ghi, target được render lại, token ID xáo trộn, keyboard fallback, không Submit và không sửa kho lưu. Thiếu vị trí, trùng ID đích, sai ví dụ, thiếu token, sai bank hoặc bố cục phải không thao tác; handler bỏ qua sự kiện không được báo thành công.

Chạy trên source và ZIP giải nén. Ảnh không cung cấp DOM/handler thật; kiểm thử không xác nhận Pearson lưu hoặc chấm bài. Nếu cấu trúc thật khác, cần chẩn đoán để xác minh thay vì ghép theo vị trí đơn thuần.
