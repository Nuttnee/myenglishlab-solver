# Kiểm thử 1.9.1 — nhận diện Reading 5A

Ngày 2026-09-29. Nguồn xác nhận: ảnh người dùng hiển thị 6.2 Reading, Exercise 5A, Activity 2518623036 và bài nối hình/đoạn văn A–D. Seed để trống exercise; tiêu đề chỉ ghi “probably Reading 5A”.

Thay đổi: thêm danh mục metadata xác minh, áp dụng khi đọc thư viện đã lưu và khi đối chiếu bài. Không chỉnh seed, đáp án hoặc cơ chế kéo thả. Thông tin đã nhập có mâu thuẫn không bị ghi đè.

`work/test-reading-5a.cjs` đạt:

- Nhận đúng bài theo Activity ID hoặc section/exercise/skill.
- Từ chối liên kết sang 5A khi section/exercise/skill trái nhau; không ghi đè bài người dùng đã sửa số bài.
- Từ chối khi có hai bản trùng thông tin hoặc trang chứa nhiều exercise khác nhau.
- Edge + extension MV3 thật với thư viện cũ trong chrome.storage.local: tự mở 5A, tiêu đề hiện Ex 5A, có bốn đáp án. Bấm Nhận bài đang mở từ bài cũ chuyển đúng sang 5A.
- Dữ liệu nguồn trong storage và seed giữ nguyên; đáp án không thay đổi.

Hồi quy `work/test-ordering-detect.cjs`: đạt các kiểm tra nhận dạng khay từ, trang mơ hồ, xuất chẩn đoán và kiểm tra loại ô trước khi bật picker.

Giới hạn: kiểm thử trên HTML mô phỏng tiêu đề đã thấy trong ảnh, chưa chạy trên phiên Pearson thật. **Bản này chỉ sửa nhận bài; chưa xác minh được tự kéo nhãn vào hình B/C/D.** Cần JSON chẩn đoán của bài để kiểm tra cấu trúc nhãn/đích.
