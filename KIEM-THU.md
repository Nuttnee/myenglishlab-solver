Kiểm thử Writing 7.1 Ex 8: [báo cáo](docs/verification-paragraph-ranks.md).

Kiểm thử Reading 7.1 Ex 6: [báo cáo](docs/verification-reading-pictures.md).

Kiểm thử nhận bài nghe dưới tiêu đề Grammar: [báo cáo](docs/verification-header-skill.md).

Kiểm thử cập nhật 2026-10-02: [Nhận bài ôn tập và giao diện](docs/verification-review.md).

Bản hiện tại: **1.11.0**. Xem [KIEM-THU-1.11.0.md](KIEM-THU-1.11.0.md).

Bản hiện tại: **1.10.2**. Xem [KIEM-THU-1.10.2.md](KIEM-THU-1.10.2.md).

Bản hiện tại: **1.10.1**. Xem [KIEM-THU-1.10.1.md](KIEM-THU-1.10.1.md).

Bản hiện tại: **1.10.0**. Xem [KIEM-THU-1.10.0.md](KIEM-THU-1.10.0.md).

Bản hiện tại: **1.9.2**. Xem [KIEM-THU-1.9.2.md](KIEM-THU-1.9.2.md).

Bản hiện tại: **1.9.1**. Xem [KIEM-THU-1.9.1.md](KIEM-THU-1.9.1.md).

Bản hiện tại: **1.9.0**. Xem [KIEM-THU-1.9.0.md](KIEM-THU-1.9.0.md) cho thao tác kéo từng thẻ thành câu và kết quả hồi quy. Nội dung dưới là lịch sử kiểm thử.

# Bản mới nhất: 1.8.3

Xem KIEM-THU-1.8.3.md cho kiểm tra điều khiển phù hợp với trang. Phần dưới là lịch sử.

# Bản mới nhất: 1.8.2

Xem KIEM-THU-1.8.2.md cho nhận dạng bài sắp xếp từ; KIEM-THU-1.8.1.md cho ô ký tự. Các kết quả bên dưới là lịch sử.

# Bản mới nhất: 1.8.1

Xem KIEM-THU-1.8.1.md cho cơ chế điền từng ký tự. Phần dưới là kết quả 1.8.0, không phải kiểm thử lại toàn bộ trong 1.8.1.

# Kiểm thử 1.8.0 · 29/09/2026

Đã dùng 13 file fixture độc lập từ khao-sat-dieu-khien/fixtures, tổng 25 tình huống. Fixture phần lớn là DOM giả lập; bộ cũ chỉ có một phần bằng chứng DOM kéo thả thật. Chưa chạy trên tài khoản Pearson thật.

| Kết quả | Số tình huống |
|---|---:|
| Hoàn thành toàn bộ, mô hình app của fixture ghi nhận đúng | 11 |
| Làm một phần, giữ nguyên ô mơ hồ hoặc chưa hỗ trợ | 3 |
| Chỉ làm câu A theo yêu cầu, B/C giữ nguyên | 1 |
| Từ chối hoặc chưa hỗ trợ, không điền nhầm | 9 |
| DOM đã có giá trị nhưng app chỉ nghe keyup chưa ghi nhận | 1 |

Trường hợp cuối vẫn là hạn chế; extension báo chưa xác nhận Pearson đã lưu. Không tính các trường hợp từ chối là hoàn thành bài. 25 tình huống đều không Submit và không có lỗi JavaScript. Chi tiết lưu ở KIEM-THU-1.8.0.json.

Kiểm tra qua extension thật trong Edge với trang giả lập: điền một phần từ UI, không mở picker cho kéo thả chưa biết đích/click-token, chọn bài thủ công, dừng khi đổi trang hoặc mâu thuẫn Exercise, nhận Activity ID từ nguồn, không bỏ checkbox của nhóm khác và xuất chẩn đoán bỏ canary ngoài bài/query/hash/Activity ID. Cấu trúc answerBox và chữ ::before vẫn xuất được.

Đã chạy lại 6 bộ hồi quy: tự điền 12 ô và hàng đợi qua iframe; radio; T/F; bộ chọn native/kéo/phân loại; HTML5/jQuery UI với ô thay DOM, dừng/hủy, hình có nhãn; cấu trúc tái tạo từ diagnostic cũ với bàn phím. Các bộ đều qua.

BAO-CAO-RA-SOAT.json và KIEM-THU-CU.md là lịch sử trước 1.8.0. Số 304/304 hay 104/104 từ fixture sinh theo seed không chứng minh các bài đó hoạt động trên Pearson.
