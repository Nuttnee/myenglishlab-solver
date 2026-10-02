<div align="center">

# MyEnglishLab Solver

Tra cứu đáp án · Nhận diện bài · Hỗ trợ thao tác trên MyEnglishLab

**Chrome & Edge** · Manifest V3 · Giao diện tiếng Việt

[Tải bản cài mới nhất](https://github.com/Nuttnee/myenglishlab-solver/releases/latest) · [Hướng dẫn sử dụng](docs/usage.md) · [Tài liệu kỹ thuật](docs/README.md)

</div>

---

## Bắt đầu trong 3 bước

1. Vào **[Releases](https://github.com/Nuttnee/myenglishlab-solver/releases/latest)** và tải **myenglishlab-solver.zip** trong mục Assets.
2. Giải nén → mở `chrome://extensions` hoặc `edge://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục chứa `manifest.json`.
3. Mở bài MyEnglishLab, bấm **EN** hoặc **Alt+Shift+M**, kiểm tra bài được nhận rồi chọn nút tự làm phù hợp.

**Đang dùng bản cũ?** Chép bản mới vào đúng thư mục extension đã nạp, bấm **Reload** rồi **F5** trang bài. Giữ nguyên thư mục để giữ kho đã lưu; xuất kho JSON trước nếu cần chuyển thư mục.

## Có gì trong extension?

| Chức năng | Hỗ trợ |
| --- | --- |
| Kho đáp án | 310 bài, tìm theo khóa học, Unit và dạng bài; nhập/xuất JSON |
| Nhận bài đang mở | Đối chiếu tiêu đề, nội dung và liên kết đã xác minh |
| Điền và chọn | Ô nhập, ô chữ, lựa chọn, từ bấm trong câu và ô hiện khi rê chuột |
| Kéo thả và sắp xếp | Kéo từ, ghép nhãn với hình, xếp từ/câu và nối cặp theo cấu trúc được hỗ trợ |
| Khi chưa nhận được | Chọn bài thủ công, kiểm tra ghép ô hoặc xuất chẩn đoán |

Extension giữ các ví dụ có sẵn và báo những câu chưa ghép được. **Bạn kiểm tra kết quả và tự bấm Save/Submit.** Không phải mọi widget Pearson đều được hỗ trợ; số bài trong kho không phải số bài đã kiểm thử trực tiếp.

## Tài liệu

- **[Cách dùng & xử lý sự cố](docs/usage.md)** — cài đặt, cập nhật, chọn bài và gửi chẩn đoán.
- **[Kiểm thử & cấu trúc mã](docs/README.md)** — báo cáo theo tính năng và cách đóng gói.
- **[Ghi chú phát hành](docs/releases/v1.14.5.md)** — thay đổi trong bản mới nhất.

## Dành cho phát triển

```text
lib/       Nhận diện, ghép đáp án và thao tác trên trang
data/     Kho đáp án nguồn
tests/    Kiểm thử và dữ liệu tái hiện
docs/     Hướng dẫn, báo cáo và lịch sử
tools/    Công cụ phát triển, đóng gói
```

Chạy `python tools/package-release.py` để tạo ZIP cài đặt và SHA-256 trong `dist/`. ZIP không chứa kiểm thử, báo cáo cũ hay công cụ phát triển.

Mã nguồn và kho đáp án nằm trong repo; dữ liệu người dùng lưu trong extension. Không cần API key. Các kiểm thử trình duyệt dùng trang tái hiện: kết quả đạt chưa xác nhận Pearson đã lưu hoặc chấm bài.
