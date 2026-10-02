# Chẩn đoán điều khiển chưa được hỗ trợ

**Cập nhật:** sau khi nhận JSON mới, đã bổ sung bộ xử lý chọn một từ. Xem [kiểm thử hiện tại](verification-inline-choices.md). Nội dung bên dưới ghi lại tình trạng trước khi có cấu trúc thật.

2026-10-02. Bài người dùng: 8.1 Grammar: relative clauses, Exercise 3.

JSON người dùng gửi (bản 1.11.8) có `controls.fields=[]`, `controls.structure=[]`, danh sách kéo/thả và nối cặp đều rỗng. Ảnh cho thấy từ bấm trực tiếp trong câu, nhưng không cho biết phần tử HTML hay thuộc tính/trạng thái được cập nhật sau khi bấm. Báo cáo khảo sát cũ cũng chỉ xác định dạng qua ảnh, không có DOM của widget này. Kết nối trình duyệt hiện tại không có tab Pearson.

## Đã thay đổi

Chẩn đoán nhận lesson hiện tại và tìm các vùng nhỏ nhất chứa nguyên câu nguồn. Thu thập tối đa 30 vùng, 120 node/vùng, 1.800 node tổng; giới hạn tìm kiếm 8.000 phần tử. Ghi cây có chỉ số cha, text node theo thứ tự, class, một số thuộc tính điều khiển và kiểu hiển thị (gạch chân, độ đậm, màu, con trỏ). Thu cả khi không có ô nhập/radio được hỗ trợ.

Không thu toàn bộ HTML, URL liên kết, script, mã xử lý sự kiện, giá trị input, vùng ẩn, thanh điều hướng hoặc panel extension. Không bấm hay sửa trang khi xuất chẩn đoán. Trạng thái trả về cho dạng Click alternatives chưa hỗ trợ hướng dẫn chọn một từ rồi xuất file.

## Kiểm thử

`tests/unknown-widgets.cjs` chạy extension thật trong Edge trên fixture có các span tùy biến cố ý chưa hỗ trợ:

- Không có native fields, nhưng chẩn đoán vẫn thu đủ mười vùng câu và thứ tự hai từ lựa chọn.
- Sau một lần bấm mô phỏng từ thứ hai của câu 2, file ghi class selected và kiểu gạch chân/in đậm mới.
- Xuất file không tăng bộ đếm click; không lộ giá trị input ẩn, URL hoặc nội dung điều hướng của fixture.
- Nút tự làm vẫn báo chưa hỗ trợ, không bấm đoán hoặc báo thành công giả.

## Chưa hoàn tất

**Chưa triển khai tự chọn từ cho widget Pearson trong ảnh.** Cần JSON mới từ trang thực tế sau khi một từ đã được chọn để đối chiếu cấu trúc và dấu hiệu xác nhận. Đây là bản cải thiện thu thập bằng chứng; fixture không được dùng làm bằng chứng rằng Pearson sử dụng cùng class hoặc handler.
