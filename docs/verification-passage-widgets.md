# Chẩn đoán chọn nhiều từ sai trong đoạn văn

Đây là báo cáo lịch sử bản 1.13.2. Bản hiện tại đã có [adapter chọn nhiều từ từ JSON mới](verification-multiple-words.md).

Ngày: 2026-10-02. Manifest nội bộ: 1.13.2.

Ảnh: 8.2 Listening Exercise 6B, Activity 2520700219. Kho có đúng bài `ta2-u8-8.2-ex6b`. JSON người dùng bản 1.13.1 trả về fields, structure và questionWidgets.regions đều rỗng. Không có bằng chứng DOM để xác định selector hoặc trạng thái chọn; bản này **chưa bổ sung adapter tự chọn**.

Nguyên nhân xuất thiếu: prompt chứa chú thích `(select the wrong word)` không có trên trang. Bộ chẩn đoán trước đây tìm nguyên prompt, nên bỏ qua cả đoạn văn. Giới hạn 120 node mỗi vùng cũng không đủ cho đoạn dài nếu mỗi từ là một phần tử.

Quy tắc mới tìm cả prompt nguyên gốc, prompt đã bỏ phần chú thích bằng hàm chuẩn hóa chung và passage. Chỉ lấy vùng nhỏ nhất khớp ít nhất năm từ, tối đa 3.200 ký tự; tăng giới hạn mỗi vùng lên 500 node, tổng 2.400 node. Giữ trạng thái class/ARIA và thứ tự cây; vẫn loại input, vùng ẩn, điều hướng, URL và mã sự kiện. Không bấm thử trong khi xuất chẩn đoán.

`node tests/passage-widgets.cjs`: đạt trên trang mô phỏng 135 token của passage thật, đầy đủ đến cuối đoạn; vẫn thu đúng khi bỏ passage và chỉ còn prompt có chú thích. Class thay đổi sau một click thủ công được thu lại. Không xuất giá trị input, nội dung ẩn hoặc URL. Tự làm báo chưa hỗ trợ, không bấm từ đoán hoặc Save/Submit.

Hồi quy `unknown-widgets.cjs` và `inline-choices.cjs`: đạt. Chưa chạy trên Pearson thật. Cần JSON mới sau khi người dùng chọn một từ để phát triển và kiểm chứng adapter.
