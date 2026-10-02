# Kiểm thử 1.10.0 — crossword

Ngày 2026-09-29. Dữ liệu: JSON chẩn đoán (5), ảnh tiêu đề 6.3 Vocabulary: illness / Exercise 1, Activity 2518626871; lớp ô trong JSON xác nhận 10 nhóm RESPONSE, 54 ô sửa được và 8 ô ví dụ. Tọa độ lưới kiểm thử được dựng theo ảnh vì JSON cũ chưa ghi tọa độ.

## Thay đổi

- Bổ sung metadata nhận bài 6.3 Ex 1 trong catalog riêng. Không đổi seed hoặc đáp án. Áp dụng cả khi đọc thư viện đã lưu.
- Adapter crossword tách khỏi native input và cụm chữ liền hàng. Gom theo lớp nhóm RESPONSE, sắp theo tọa độ và xác minh hướng/độ dài. Mỗi ô giao thuộc nhiều nhóm, chỉ ghi một lần sau khi các đáp án đồng thuận.
- Bảo toàn số câu và ví dụ. Kiểm tra toàn bộ lưới trước khi viết. Chặn picker nhập cả từ/bấm ô lần lượt trong crossword; giao diện có Tự điền ô chữ và Tự làm câu này.
- Chẩn đoán mới xuất cả mã nhóm, giá trị, trạng thái khóa và vị trí/kích thước ô.

## Đạt

`work/test-crossword.cjs` chạy Edge với extension MV3 thật:

- So multiset lớp nhóm của mọi ô fixture với JSON (5), gồm tất cả ô giao nhau.
- Tự nhận 6.3 Ex 1; nút hàng đợi thường được ẩn. Bộ scan thường không coi lưới là 54 câu độc lập.
- Điền 9 từ vào 54 ô sửa được; model của trang ghi nhận input từng ô. MEDICINE, các ô số câu và nút Submit không thay đổi. DOM cố ý đảo thứ tự để kiểm tra sắp theo hình học.
- Chạy lại: 9 từ đã đúng, không ghi thừa. Chỉ làm 5 across: ghi 10 ô, giữ chữ I có sẵn tại giao điểm.
- Chặn trước lần ghi đầu khi ví dụ sai, hình học đứt đoạn, hướng sai, độ dài sai, số từ trùng hoặc đáp án giao nhau mâu thuẫn.
- Trang bỏ ký tự: không báo hoàn tất. Dừng giữa chừng hoặc đổi Exercise: dừng ghi.
- Diagnostic xuất 62 ô với tọa độ và các nhóm dùng chung.

Hồi quy:

- `work/test-letters.cjs`: đủ 13 từ menu trên ba dạng markup; giữ chữ gợi ý, điền cụm, không chuyển hàng đợi khi trang từ chối; đạt.
- `work/test-auto-fill.cjs`: điền 12 câu, hàng đợi, giữ ví dụ, sửa giá trị cũ, ngừng khi đổi trang, iframe, nhận bài; đạt.
- `work/test-reading-5a.cjs`: nhận 5A trên kho cũ, từ chối metadata mâu thuẫn, không đổi source lưu; đạt.

## Giới hạn

Chưa thực thi trên phiên Pearson thật của người dùng. Fixture sử dụng thành viên nhóm từ JSON thật và vị trí từ ảnh; handler nhập và model ghi đáp án là mô phỏng. Chỉ xác nhận ký tự giữ trên DOM, chưa xác nhận Pearson lưu/chấm. Không Save/Submit.

Yêu cầu lưới có input.cw và nhóm response-RESPONSE_N, một mã cho mỗi từ trong kho, một lưới hiển thị. Lưới khác cấu trúc, hàng/cột không đều hoặc nhiều từ cùng số nhưng không phân biệt được sẽ từ chối; không tự bịa hướng hay vị trí. Có thể chuẩn hóa khoảng trắng/gạch nối trong đáp án, không thay đổi dữ liệu nguồn.

Seed SHA256 không đổi: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
