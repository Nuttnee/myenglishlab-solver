# Money · Unit 8 · Exercise 1

Ngày đối chiếu: 2026-10-02. Ảnh người dùng có Activity 2520708786, tiêu đề Money, đoạn nói của Finn và ví dụ lot. Nội dung khớp bài `ta2-u8-x-exx-r`, Talking about shopping habits, ảnh nguồn image260.

Bổ sung liên kết Activity, tiêu đề Money và số bài 1 trong catalog. Giữ section trống vì đây là video Unit 8, không phải section 8.x. Giữ nhãn vocabulary, đáp án, ghi chú nguồn và kho đã lưu. Không thêm quy tắc điền riêng cho bài này.

`tests/money-overview.cjs` chạy extension MV3 thật trong Edge với HTML dựng lại từ ảnh và sự kiện change mô phỏng:

- Nhận đúng bài từ Activity; không nhận từ riêng Exercise 1; từ chối Exercise 2.
- Điền năm ô: buying, also, markets, about, feel. Ví dụ lot giữ nguyên.
- Điền riêng câu 4 với ngữ cảnh ngắn How / you.
- Không điền khi đoạn văn bị nhân đôi gây mơ hồ.
- Không bấm Save/Submit, không sửa dữ liệu bài trong storage.

Kết quả: PASS. Đây là kiểm thử trang mô phỏng, chưa xác nhận trực tiếp DOM và thao tác trên Pearson đang đăng nhập. Sau cập nhật cần Reload extension rồi F5 trang.

## Cập nhật 13/10/2026 — Activity ID thay đổi

Ảnh mới có Activity 2525336891; hai ô đầu chứa cash. Không thêm ID này vào catalog: nhận diện dùng quy tắc chung ghép hai vế của câu có một khoảng trống, với ít nhất ba câu khác nhau, hai câu không phải ví dụ, tổng ít nhất 16 từ và khớp ít nhất nửa số câu điền. Chỉ nhận khi có một ứng viên phù hợp; tiêu đề mâu thuẫn vẫn bị từ chối. Nội dung ô nhập không dùng làm bằng chứng nhận bài.

Kiểm thử nhận và điền trên trang mô phỏng với ID mới và ID chưa biết đều đạt, sửa cash thành buying/also, giữ lot. Các trường hợp chỉ có hai câu ngắn, hai bài cùng nội dung, tiêu đề sai và hai đoạn giống nhau không bị điền nhầm. Hồi quy shopping-paragraph, header-skill và review-detection đạt. Chưa thử trực tiếp trên Pearson đăng nhập.
