# Nhận bài ôn tập và bỏ nhãn phiên bản trên giao diện

Ngày 2026-10-02. Chẩn đoán người dùng ghi Exercise 6, skill function, section rỗng; ảnh hiển thị R2. Kho đã có `ta2-u6-r2-ex6` với đầy đủ bảy câu (câu 1 là ví dụ). Bộ đọc tiêu đề cũ chỉ nhận mã thập phân, còn so khớp nội dung không đủ bằng chứng vì câu quá ngắn.

## Sửa đổi

- Đọc mã R/Review bên cạnh chủ đề, ở tiêu đề liền hoặc các ô riêng; chuẩn hóa hoa/thường/khoảng trắng. Giữ hỗ trợ 6.1/6.2. Từ chối nhiều mã section mâu thuẫn trên cùng trang.
- Tên extension và bảng chỉ là MyEnglishLab Answer Helper / Answer Helper. Chrome vẫn dùng số manifest nội bộ. Không đổi khóa storage hoặc thư mục nạp extension.
- Không thêm Activity ID hay thay seed để nhận riêng bài R2 Ex 6.

## Kiểm thử

`tests/review-detection.cjs` dùng Edge, extension MV3 thật và trang mô phỏng từ nội dung/nguồn/đích quan sát được trong chẩn đoán, ảnh và kho. Không cần file chẩn đoán ngoài repo để chạy test.

- Nhận đúng R2 Ex 6 mà không cần Activity ID đã liên kết; tự kéo sáu cụm, giữ front of you, chạy lại bỏ qua sáu ô đúng; không Submit.
- Nhận R1, r2, R 3, Review 2 và 6.2 với tiêu đề riêng/liền. Câu văn chứa R2 không bị coi là mã bài. Hai section mâu thuẫn bị từ chối.
- Tiêu đề giao diện không còn nhãn V11 hoặc số phiên bản.
- Hồi quy Reading 5A / metadata / kho cũ: đạt (`work/test-reading-5a.cjs` trong workspace phát triển).
- Hồi quy định tuyến matching/dropdown/checkbox/phân loại: đạt (`work/test-general-routing.cjs`).

Chưa xác minh trên phiên Pearson thật: handler kéo thả trong test là mô phỏng. Test nối SVG cũ chưa chạy lại vì file chẩn đoán (8) bên ngoài repo không còn ở đường dẫn cũ; lần này không chỉnh adapter nối SVG.

Chạy test: cài Playwright vào môi trường Node (hoặc cấu hình NODE_PATH), đặt MEL_TEST_BROWSER đến Chrome/Edge nếu cần, rồi `node tests/review-detection.cjs`.

Seed SHA256 giữ nguyên: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
