# Kiểm thử ô ký tự · 1.8.1

Ngày 29/09/2026. Edge nạp extension thật, HTML giả lập. Không có DOM thật của ảnh người dùng nên đây không phải xác nhận hoạt động trên Pearson.

- 13 đáp án của menu/recipe trong seed: lemon, broccoli, Beefsteak, spinach, potatoes, leg of lamb, cabbage, courgettes, shrimps, onions, garlic, mussels, cheese. Dùng chữ gợi ý tương ứng ảnh; bố cục HTML được tái tạo.
- Chạy ba cấu trúc: ô nhập maxlength=1 + span gợi ý; input readonly làm gợi ý; ô nhỏ không khai maxlength + span gợi ý. Cả 13 từ khớp, mô hình app ghi từng ký tự, toàn bộ chữ cố định giữ nguyên, không Submit.
- Có giá trị nguyên từ sai từ trước trong ô trắng; bản mới thay bằng đúng một chữ.
- Bấm ô bất kỳ trong từ điền cả từ; bấm lại không tăng hàng đợi; bấm từ có gợi ý không khớp không đổi đáp án. Escape dừng.
- Trang từ chối chữ i của shrimps: giữ đáp án; thử lại điền i rồi mới chuyển tiếp.
- Chỉ vị trí điền onions bằng từng chữ. Đổi chữ gợi ý sau khi quét làm kế hoạch hết hiệu lực.
- Mẫu c□t có hai đáp án cat/cut: từ chối khi thiếu ngữ cảnh. Chữ gợi ý/độ dài không khớp bị từ chối; ô đơn maxlength=1 không nhận nguyên từ. Hủy trước khi điền không ghi ký tự.
- Hồi quy tự điền 12 ô, bấm lần lượt qua iframe, radio và hủy; không lỗi JavaScript trong các bộ này.

Mã kiểm thử: work/test-letters.cjs, work/test-letter-rules.cjs, work/test-auto-fill.cjs, work/test-radio.cjs trong workspace. Seed study giữ nguyên SHA256 61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021.
