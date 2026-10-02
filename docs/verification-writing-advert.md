# Writing 8.2 · Exercise 3B

Ngày: 2026-10-02. Manifest nội bộ: 1.13.1.

Ảnh người dùng xác nhận Exercise 3B, Writing: adding emphasis, Activity 2520699278, yêu cầu mô tả một sản phẩm trong 50–100 từ. Hình laptop, xe đạp và máy ảnh khớp bài nguồn `ta2-u8-x-model1`, image248. Catalog bổ sung section/exercise/Activity ID; giữ nguyên tên chủ đề nguồn và bài mẫu máy ảnh. Seed và kho đã lưu không bị sửa.

Bài mẫu có 62 từ khi đếm theo khoảng trắng, bỏ dấu đầu dòng; vẫn trong giới hạn 50–100. Bộ điền textarea hiện có được dùng lại, không cần adapter riêng cho bài.

`node tests/writing-advert.cjs` đạt:

- Nhận bằng tiêu đề hoặc Activity ID; không nhầm Ex 3A, section/kỹ năng khác; từ chối danh tính trùng lặp.
- Nạp extension MV3 thật với kho cache chưa có metadata mới, nhận đúng bài dù Activity ID chưa liên kết.
- Điền nguyên văn mẫu, giữ xuống dòng và dấu đầu dòng, handler change mô phỏng nhận giá trị; không Save/Submit.
- Hai textarea thì không đoán ô; đổi sang Ex 3A thì từ chối thao tác bài mẫu.

Trang và textarea dựng từ ảnh, handler mô phỏng trong Edge. Chưa xác minh DOM hoặc lưu/chấm trên Pearson thật.
