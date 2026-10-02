# Chọn nhiều từ/cụm từ trong đoạn văn

Ngày: 2026-10-02. Manifest nội bộ: 1.14.0.

JSON 1.13.2 người dùng gửi cho Listening 8.2 Ex 6B ghi nhận `.underlineGroup.multiple` và 15 `.underlineElement[role=button][aria-pressed]`. `the garden` có class selected, aria-pressed=true; các lựa chọn khác false. Cây này được giữ trong `tests/fixtures/multiple-words-observed.json`. Vùng xuất tối thiểu bắt đầu ở years và kết thúc ở Mr Jones; fixture phục hồi phần cố định bên ngoài theo nguồn/ảnh, gồm ví dụ fifteen và đuôi câu cuối.

## Quy tắc

Adapter chung không chứa ID bài, Activity ID hay đáp án cụ thể. Ghép nguyên đáp án với phần văn bản trước/sau trong prompt, bỏ chú thích nguồn bằng quy tắc hiện có. Lấy ngữ cảnh trong itemContent, không chỉ trong nhóm token. Nhờ đó hai token years ở hai câu khác nhau không bị lẫn. Không dùng prompt có các lựa chọn cách nhau bằng dấu `/` để suy ra thao tác chọn độc lập.

Chỉ click token chưa có aria-pressed=true. Sau mỗi click, kiểm tra trạng thái true, cấu trúc/nội dung câu vẫn nguyên và các token khác không bị đổi trạng thái. Giữ ví dụ và từ đã chọn đúng; nếu đang có từ khác được chọn, dừng và báo để người dùng kiểm tra, không tự xóa. Câu/đoạn trùng lặp hoặc ngữ cảnh không đủ thì không đoán. Không Save/Submit. Seed và dữ liệu người dùng không đổi.

## Kiểm thử

`node tests/multiple-words.cjs` nạp MV3 vào Edge với DOM từ JSON thật và handler click mô phỏng:

- Giữ the garden đã chọn, bấm years ở câu A few years later, $15,000 và Mr Jones; không chọn years đầu đoạn, không sửa fifteen ví dụ.
- Chạy lại bỏ qua cả bốn đáp án, không toggle. Hỗ trợ nút từng câu.
- Click bị bỏ qua, chỉ đổi style, hành vi kiểu chọn một làm mất lựa chọn trước, hoặc đổi bài giữa chừng: dừng, không tính là thành công.
- Có lựa chọn ngoài đáp án: giữ nguyên và báo. Đoạn trùng hoặc đổi Exercise 6A: không bấm nhầm.

Hồi quy `inline-choices.cjs`, `passage-widgets.cjs`, `single-reading-choice.cjs` đạt. Chưa chạy trên Pearson thật hoặc xác nhận lưu/chấm; kết quả xác minh ở mức DOM và handler mô phỏng.
