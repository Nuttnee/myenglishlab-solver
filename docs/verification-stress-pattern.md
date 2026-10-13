# 9.1 · Grammar · Ex 3 — mẫu trọng âm

Ảnh người dùng ngày 13/10/2026 cho thấy bài được nhận đúng nhưng cả tự chọn và bấm ô lần lượt chưa ghép được. Ba lựa chọn oOo / Ooo / ooO chỉ khác hoa–thường, trong khi optionMatch trước đây chuyển toàn bộ về chữ thường.

Quy tắc chung mới giữ nguyên hoa–thường cho chuỗi ký hiệu o/O từ hai ký tự trở lên; chuẩn hóa Unicode và khoảng trắng. Khi đáp án là mẫu trọng âm, nhãn hiển thị có ưu tiên hơn giá trị nội bộ của radio/select. Không thêm nhánh theo bài hoặc ID. Các từ thông thường vẫn so không phân biệt hoa–thường, T/True và F/False vẫn tương đương.

Nguồn ta2-u9-9.1-ex3 giữ nguyên đáp án Ooo và mức tin cậy thấp; bản sửa này xử lý lựa chọn theo nguồn, không xác minh lại nội dung audio.

Kiểm thử tests/stress-pattern.cjs:

- Phân biệt đủ ba mẫu, chấp nhận O o o với Ooo; từ chối ooo, nhãn trùng, thiếu đáp án hoặc value nội bộ mâu thuẫn với nhãn.
- MV3 trong Edge trên HTML tái hiện: tự nhận header Grammar với nguồn pronunciation, chọn Ooo và thay lựa chọn oOo đang sai.
- Bấm ô lần lượt chọn đúng Ooo khi người dùng bấm vào lựa chọn khác trong cùng câu.
- Chạy lại không click dư; không Save/Submit hoặc sửa kho lưu; chuyển Exercise 4 bị từ chối.

Các kiểm thử single-reading-choice, inline-choices và video-choices đạt. Đây là DOM và handler mô phỏng theo ảnh; chưa xác minh trực tiếp trên Pearson đăng nhập.
