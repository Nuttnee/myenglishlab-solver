# Kéo từ vào nhiều ô trong cùng đoạn

Ngày kiểm thử: 2026-10-02. Trường hợp báo lỗi: **7.2 · Grammar: purpose, cause and result · Exercise 4**.

## Bằng chứng và nguyên nhân

Ảnh người dùng có bốn đoạn đánh số 1–4, mỗi đoạn có hai vị trí đáp án. Kho study đánh số tám vị trí 1–8. Quy tắc cũ ưu tiên số đoạn như số câu, khiến hai ô tranh cùng đáp án. Ngoài ra khay chứa nhiều `so` và một `So`; chọn nguồn cũ chỉ giải quyết được một thẻ trùng chính xác hoặc một nhóm hoàn toàn giống nhau, nên hỗn hợp này bị coi là mơ hồ.

Fixture mới tái hiện thông báo `drag-unrecognised` trước khi sửa. Nó dựng các đoạn LI với hai ô inline theo nội dung ảnh; không phải bản DOM xuất từ Pearson.

## Quy tắc chung sau sửa

- Với nhiều ô cùng vùng câu, số vùng không đủ xác định một ô. Ghép bằng phần câu sát trước/sau ô; vẫn giữ quy tắc riêng cho nguồn có các phần 1a/1b hoặc nhiều đáp án trong cùng câu.
- Chọn thẻ đúng chữ hoa/thường. Nhiều thẻ chữ giống hệt nhau có thể thay thế nhau khi cùng một khay; phân tích lại sau mỗi lần kéo để không lấy lại thẻ đã đặt.
- Không coi nội dung sai chữ hoa/thường là đã hoàn tất; giữ ô đã có nội dung khác và báo chưa xong.
- Quét điều khiển thực tế cho mọi loại bài trong kho. Bài được ghi là `fill_blank` nhưng trang dùng thẻ kéo sẽ hiện **Tự kéo thả cả bài**, không hiện chế độ bấm ô nhập.
- Metadata tiêu đề/Activity ID bổ sung trong catalog; `data/seed.json` và đáp án gốc không thay đổi. Không có nhánh thao tác riêng cho ID bài này.

## Kết quả

`tests/inline-drag-blanks.cjs` chạy extension MV3 thật trong Edge, dùng handler HTML5 mô phỏng:

- Tự chọn đúng bài từ kho đã lưu, kéo bảy thẻ `so / Because / So / To / so / so / to`, giữ `because` ví dụ.
- Lần chạy lại không kéo thêm; không Submit.
- Đảo thứ tự đoạn và thay node sau khi thả vẫn đúng; không phụ thuộc số đoạn, thứ tự thẻ hay token ID.
- Giữ và báo ô có `so` khi cần `So`; thiếu `To` không lấy `to` thay thế.
- Hai khay trùng nhau hoặc câu trùng nhau không bị chọn đại.
- Handler không nhận sự kiện thì không báo thành công.

Hồi quy đạt: `review-detection.cjs`, `picture-labels.cjs`, `paragraph-ranks.cjs`, `header-skill.cjs`; các fixture phát triển `test-letters.cjs` và `test-general-routing.cjs` cũng đạt (cụm chữ, ghép nghĩa, dropdown, checkbox, kéo vào nhóm).

Chưa kiểm chứng trực tiếp thao tác và lưu/chấm trên phiên Pearson thật. Kết quả trên xác nhận ghép ô, chọn thẻ và điều phối sự kiện trên fixture. Không tự Save/Submit.
