# Tài liệu dự án

## Hướng dẫn

- [Cài đặt và sử dụng](usage.md)
- [Quy tắc thao tác và ghép đáp án](development/interaction-rules.md)
- [Ghi chú bản mới nhất](releases/v1.14.5.md)
- [Release đầu tiên](releases/v1.14.4.md)

## Mã nguồn và đóng gói

Các file nền và giao diện nằm ở thư mục gốc; `lib/` chứa các adapter, `data/seed.json` là kho nguồn. `tests/` chứa kiểm thử và fixture. Giữ nguyên kho nguồn khi bổ sung metadata nhận diện vào `lib/catalog.js`.

Từ thư mục repo, chạy `python tools/package-release.py`. Kết quả nằm trong `dist/`: ZIP có manifest ngay ở gốc và file SHA256SUMS.txt. Công cụ kiểm tra tài nguyên manifest, nội dung ZIP và dùng timestamp cố định để đóng gói lặp lại cho cùng mã nguồn.

Các kiểm thử `.cjs` cần Node.js, Playwright và Chromium/Edge hỗ trợ extension. Ví dụ: `node tests/money-overview.cjs`. Có thể đặt `MEL_TEST_BROWSER` thành đường dẫn trình duyệt. Riêng bài smoke test này hỗ trợ `MEL_TEST_EXTENSION` để chạy trên thư mục giải nén từ ZIP.

## Kiểm thử theo tính năng

Các báo cáo ghi phạm vi, nguồn bằng chứng và giới hạn. Kiểm thử trên trang tái hiện không đồng nghĩa đã kiểm chứng toàn bộ bài trên phiên Pearson thật.

- [Listening 8.3 · Exercise 5A](verification-conversation-pictures.md)
- [Ô kéo thả trong nhiều hội thoại](verification-dialogue-blanks.md)
- [Nhận tiêu đề bài độc lập với nhãn kỹ năng](verification-header-skill.md)
- [Kéo từ vào nhiều ô trong cùng đoạn](verification-inline-blanks.md)
- [Tự chọn từ trong câu](verification-inline-choices.md)
- [Chèn từ vào câu khi rê chuột](verification-insert-word.md)
- [Money · Unit 8 · Exercise 1](verification-money-overview.md)
- [Chọn nhiều từ/cụm từ trong đoạn văn](verification-multiple-words.md)
- [Writing 7.1 Exercise 8 — nhập số thứ tự trong đoạn văn](verification-paragraph-ranks.md)
- [Chẩn đoán chọn nhiều từ sai trong đoạn văn](verification-passage-widgets.md)
- [Nhận 7.1 Reading Exercise 6 — nhãn đoạn văn vào hình](verification-reading-pictures.md)
- [Nhận bài ôn tập và bỏ nhãn phiên bản trên giao diện](verification-review.md)
- [Shopping 8.3 · Exercise 1](verification-shopping-crossword.md)
- [Function 8.3 · Exercise 3](verification-shopping-paragraph.md)
- [Reading 8.1 · Exercise 6A](verification-single-reading-choice.md)
- [Chẩn đoán điều khiển chưa được hỗ trợ](verification-unknown-widgets.md)
- [Nhận bài từ các nhóm lựa chọn](verification-video-choices.md)
- [Writing 8.2 · Exercise 3B](verification-writing-advert.md)

## Lịch sử

Báo cáo cũ, khảo sát và README trước đợt sắp xếp được giữ ở [archive/](archive/README.md). Những mô tả “bản hiện tại” trong tài liệu lưu trữ chỉ đúng tại thời điểm viết.
