# Kiểm thử 1.11.0 — nối hai cột bằng đường SVG

Ngày 2026-09-29. Bằng chứng: chẩn đoán (8) của Fitness Ex 7, cùng ảnh người dùng. DOM có `.matching`, hai `.matchingGroup.left/right`, 10 `.matchingElement`, sự kiện click/keydown trên tám nút sửa được; cặp ví dụ có lớp example matched. `.matchingLines svg path` thể hiện đường nối giữa các nút. Bộ thu cũ không thấy các nút này.

## Thay đổi

Adapter chọn theo cấu trúc widget, không theo mã bài. Tìm duy nhất từng vế bằng chữ trong kho. Yêu cầu bảng khớp đầy đủ và không mơ hồ. Gửi click vào đầu trái rồi đầu phải; không viết giá trị hidden input hay tự vẽ SVG. Đọc SVG endpoints bằng getPointAtLength/getScreenCTM và đối chiếu vị trí nút cùng lớp matched trước khi tính thành công. Có xử lý cặp ví dụ, cặp đã đúng, cặp đang sai, làm từng câu, hủy và đổi bài.

UI hiện **Tự nối các cặp**, không hiện thao tác nối hai vị trí thủ công cho widget đã nhận. Bản mới vẫn giữ chẩn đoán endpoint/SVG và xuất thêm kết quả phân tích adapter.

## Kiểm thử đạt

`work/test-connections-solver.cjs` dùng extension MV3 thật trong Edge. Fixture dựng từ cây phần tử, thuộc tính, chữ, tọa độ và đường ví dụ của JSON (8). Handler click và model của trang là mô phỏng độc lập, không phải mã Pearson.

- Tự nhận bài và hiện nút tự nối; tự nối đúng bốn cặp, giữ ví dụ, không Submit. Chạy lại bỏ qua bốn cặp đúng.
- Vẽ lại SVG, CSS scale và thay toàn bộ data-id không làm đổi kết quả; không dùng hậu tố ID làm đáp án.
- Click bị bỏ qua, đường nối sai đích, chỉ đổi lớp mà không có đường hoặc chỉ có đường mà không đổi lớp: không tính thành công và dừng.
- Thiếu nút, trùng chữ, hai bảng cùng khớp, đường ví dụ sai hoặc SVG không đọc được: không bấm.
- Một cặp nối sai từ trước: giữ nguyên, hoàn thành hai cặp còn tự do, báo hai cặp chưa hoàn tất.
- Làm một cặp; hủy giữa chừng; đổi bài, thay chữ hoặc thay phần tử giữa hai click: đạt.

Hồi quy đạt:

- `test-connections-diagnostic.cjs`: nhận bài, kho cũ, dữ liệu hai cột, từ chối mơ hồ, xuất SVG/ancestor/event; không thao tác trên widget giả không đúng cấu trúc.
- `test-general-routing.cjs`: matching 6C, dropdown, checkbox, phân loại.
- `test-picture-response.cjs`: Reading 5A, ba nhãn đúng B/C/D, ví dụ, đảo DOM, dựng lại đích, keyboard fallback, từ chối cấu trúc sai, UI MV3.

## Giới hạn

Chưa thao tác phiên Pearson thật của người dùng. JSON có tên sự kiện click nhưng không có handler gốc; thử nghiệm mô phỏng kiểm tra cách gửi sự kiện, chọn cặp, xác minh và dừng. Cần thử bản này trên Pearson để xác nhận trang thực nhận click. SVG/DOM đúng không xác nhận Pearson đã lưu hoặc chấm.

Adapter này yêu cầu cấu trúc matchingGroup/matchingElement/matchingLines và đường SVG có thể ghép rõ hai đầu. Widget khác, bảng không khớp đủ kho, SVG khác cấu trúc hoặc đường đang kéo dở sẽ bị từ chối thay vì đoán. Cặp sai có sẵn không bị xóa tự động.

Seed study SHA256 không đổi: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
