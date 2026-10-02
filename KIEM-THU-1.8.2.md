# Kiểm thử 1.8.2

29/09/2026. Chưa chạy trên Pearson thật.

- Edge nạp extension với trang mô phỏng độc lập từ ảnh Ex4: đảo thứ tự 5 câu và đảo từ mỗi câu; tự nhận đúng bài nguồn chưa có số Exercise, hiện Ex4 và 5 đáp án.
- Nhấn tự làm: báo chưa hỗ trợ kéo nhiều từ thành câu, không gửi dragstart và không mở picker nhập ô.
- Từ chối khi hai bài cùng bộ từ, section mâu thuẫn, chỉ một nhóm khớp hoặc sai số lần xuất hiện của từ.
- Diagnostic ghi riêng 5 nhóm từ, không đưa toàn bộ questionText ra file.
- Hồi quy nhận bài Grammar Ex2, tự điền 12 ô, bấm lần lượt/iframe, giá trị từ chối, dừng và bài thay đổi.

Các script: work/test-ordering-detect.cjs, work/test-auto-fill.cjs. Không sửa seed hoặc cơ chế điền ký tự.
