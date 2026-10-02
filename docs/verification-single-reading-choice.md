# Reading 8.1 · Exercise 6A

Ngày kiểm thử: 2026-10-02. Manifest nội bộ: 1.12.1.

Ảnh người dùng xác nhận tiêu đề 8.1 Reading, Exercise 6A, Activity 2520696070, bài đọc THE REAL MONEY MAKERS và lựa chọn sports / music / food / films. Nguồn `ta2-u8-x-exx-d` đã có đáp án food nhưng thiếu section và số bài. Bổ sung danh tính trong catalog; không sửa seed, đáp án, ghi chú nguồn hoặc dữ liệu người dùng đã lưu. Thao tác dùng adapter radio hiện có.

## Kết quả

Chạy `node tests/single-reading-choice.cjs` với Playwright và Edge, nạp extension MV3 thật trên trang DOM mô phỏng:

- Nhận bài từ tiêu đề đúng khi Activity ID chưa từng liên kết, không cần đọc nội dung ảnh bài đọc.
- Nhận bài với Activity ID đã xác minh; từ chối section, phần bài hoặc kỹ năng mâu thuẫn và kết quả trùng lặp.
- Riêng bốn lựa chọn ngắn không đủ xác định bài: không nới quy tắc nhận diện chung.
- Chọn food, thay lựa chọn sports, chạy lại không phát sinh thay đổi; không Save/Submit.
- Kho đã lưu chưa có metadata mới vẫn nhận bài; seed và giá trị section trong kho lưu giữ nguyên.
- Khi trang đổi sang Exercise 6B, thao tác bị từ chối.

Cả kiểm thử danh tính và kiểm thử MV3 đều đạt. DOM radio và handler là mô phỏng từ giao diện ảnh, chưa có JSON của bài này. Chưa xác minh trên phiên Pearson thật hoặc xác nhận lưu/chấm điểm.
