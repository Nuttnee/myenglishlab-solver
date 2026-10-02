# Writing 7.1 Exercise 8 — nhập số thứ tự trong đoạn văn

Ngày 2026-10-02. Ảnh người dùng xác nhận **7.1 · Writing: paragraphs · Exercise 8**, Activity 2520685373, bài REACH FOR THE SKY. Đoạn mở đầu có số mẫu 2/3/1; ba đoạn cần làm là Set new goals, Do something different và Think about now.

## Nguyên nhân và sửa đổi

Kho `ta2-u7-x-exx-i219` có đủ chín đáp án nhưng chưa có section/exercise/sectionTitle và gắn skill=reading. Bổ sung metadata theo ảnh; giữ skill và seed nguyên vẹn. Bộ ghép tiêu đề đã phân biệt chủ đề Writing với kỹ năng đọc nội dung.

Trang có ô nhập thì nút chính hiện **Tự điền số thứ tự**. Cùng dạng ordering nếu không có ô nhập vẫn giữ nhãn xếp câu. Backend ưu tiên native controls có bằng chứng; không chuyển các số 1/2/3 lặp lại thành thao tác kéo câu. Ghép mỗi câu theo nội dung cục bộ, bao gồm đoạn câu bị cắt trong nguồn, thay vì điền số theo vị trí DOM.

## Kiểm thử đạt

`tests/paragraph-ranks.cjs`, extension MV3 thật trên Edge với kho cũ và fixture dựng theo ảnh:

- Tự nhận Writing 7.1 Ex 8; hiện nút Tự điền số thứ tự; chín ô nhỏ là chín trường riêng, không gom nhầm thành một từ gồm chín ký tự.
- Điền Set new goals: 1/3/2; Do something different: 2/3/1; Think about now: 3/2/1. Phát sự kiện change. Giữ ô mẫu readonly/disabled/chữ cố định; không Save/Submit.
- Đổi thứ tự câu và đoạn, câu nguồn bị cắt, dấu nháy cong: vẫn đúng. Biến thể input number và dropdown: đúng.
- Tự làm riêng một câu; câu trùng mơ hồ không được điền; đổi Exercise 9 thì từ chối đáp án Ex 8.
- Hồi quy `tests/header-skill.cjs`: Grammar Ex 5A, skill khác header, kho cũ, không dùng nhầm đáp án sau khi chuyển phần: đạt.

## Giới hạn

Ảnh không cho biết loại DOM chính xác của ô vuông. Test dùng các loại input/select thông thường và handler mô phỏng, chưa thao tác phiên Pearson thật. Nếu các ô thực tế là widget riêng thì cần file chẩn đoán để bổ sung adapter. Việc nhận metadata được đối chiếu ảnh; không khẳng định Pearson đã lưu/chấm.

Seed SHA256 không đổi: `61B2055541C16D1C6E59F3837E78CC199B013FD5C652B3B256871DF919D55021`.
