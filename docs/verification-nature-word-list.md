# Unit 9 Nature — Exercise 2

Ảnh và chẩn đoán 1.14.19 ngày 2026-10-15: bài chưa được nhận, lessonId rỗng, không có fields hoặc vùng questionWidgets. Ảnh hiển thị wildlife làm ví dụ cùng 13 nhãn động vật khớp `ta2-u9-x-exx-video-animals-mentioned`. Không dùng Activity ID phỏng đoán và không lưu chẩn đoán thô vào repo.

Catalog bổ sung Nature / Exercise 2, giữ skill listening. Nguồn có một mục đáp án chứa 10 từ phân tách bằng dấu `|` và một prompt liệt kê 13 nhãn, khác dạng selected/not selected hiện có. `MELRules.selectionList` đọc hai dạng này mà không sửa seed hoặc kho lưu. Dạng mới chỉ nhận prompt rõ `Select the words ...:`, ít nhất sáu nhãn phân tách bằng dấu phẩy, tập đáp án là tập con duy nhất, ví dụ khớp nhãn riêng. Bộ nhận bài yêu cầu toàn bộ chuỗi nhãn kể cả wildlife; bộ thao tác yêu cầu đủ nhóm token có role button và aria-pressed rõ ràng.

Các đáp án nguồn: sharks, big cats, spiders, whales, dog, horses, guinea pig, scorpions, snakes, foxes. Không chọn cows, monkeys, birds. Chưa đối chiếu lại video hoặc kết quả chấm Pearson; không đổi đáp án nguồn.

`tests/nature-word-list.cjs` chạy MV3 Edge với văn bản từ ảnh và cấu trúc widget/handler mô phỏng. Kiểm thử source và ZIP giải nén: Activity ID mới; danh sách thiếu/trùng không nhận; dữ liệu nguồn lỗi không phân tích; chọn 10 và bỏ qua 3; giữ ví dụ; lần chạy lại không bấm thêm; làm riêng 1.5; thiếu token, trùng nhóm, ví dụ sai, trạng thái không rõ không bấm; trạng thái chọn sai hiện có được giữ và báo; handler không nhận, loại trừ nhau hoặc đổi header thì dừng; không Save/Submit hoặc sửa kho lưu.

Khi mô phỏng widget chưa biết, không bấm và chẩn đoán đọc được vùng chứa toàn bộ nhãn. Chẩn đoán thực tế hiện chưa có DOM token nên kiểm thử này chỉ chứng minh hỗ trợ có điều kiện, chưa chứng minh widget trên phiên Pearson thật. Nếu cập nhật vẫn không chọn được, xuất lại chẩn đoán sau khi bài được nhận.

Hồi quy đạt: `money-word-list.cjs`, `multiple-words.cjs`, `passage-widgets.cjs`. SHA-256 của seed giữ nguyên.
