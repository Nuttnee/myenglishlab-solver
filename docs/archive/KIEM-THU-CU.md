# Lịch sử kiểm thử trước 1.8.0

Các kết quả dưới đây chỉ thuộc các phiên bản cũ. Không dùng làm số đo độ phủ Pearson hiện tại.

# Kết quả kiểm thử · V11 Plus 1.7.0

Ngày kiểm thử: 29/09/2026 (giờ Việt Nam/Thái Lan).

## Rà soát và bộ quy tắc chung 1.7.0

- Đã đọc toàn bộ 310 bài/10 Unit. 304 bài có danh sách đáp án; 4 bài viết và 2 bài nói không có danh sách câu cần điền.
- 304/304 bài qua phép kiểm tra kế hoạch ghép với mô hình ô có số câu, đảo thứ tự câu. Đây là dữ liệu kiểm thử sinh từ nguồn, không phải 304 bài Pearson thật và không xác nhận DOM ngoài thực tế.
- 104/104 bài phù hợp mô hình mỗi câu một đích kéo qua phân tích DOM mô phỏng trong Edge (nối, hình có nhãn/số, điền, sắp xếp). Chỉ kiểm tra phân tích/ghép, không thực thi 104 widget kéo thả thật.
- Test thực thi extension: bài nối nghĩa 6C có prompt bị cắt/ngoặc ghi chú, đảo câu và bỏ số; cùng bài chuyển sang dropdown thì tự chọn adapter native.
- Test checkbox nhiều lựa chọn: chọn đủ tập đáp án và bỏ distractor đã tích sai trong cùng câu có số.
- Test phân loại: kéo từ trong prompt vào nhóm Regular/Irregular có nhãn, nhiều từ cùng một đích.
- Chạy lại 12 ô Grammar, radio/T-F, hàng đợi qua iframe, hủy, từ chối giá trị, jQuery UI/HTML5/keyboard, giữ junk đã làm, target thay DOM và các fixture theo file chẩn đoán cũ.
- Bộ quy tắc không chứa ID bài/tài khoản để sửa riêng bài 6C. Seed không sửa. Chi tiết nguyên tắc/giới hạn ở QUY-TAC.md.

## T/F có đáp án trùng nhau 1.6.6

Đọc file myenglishlab-keo-tha-chan-doan (2).json: bản 1.6.5, đúng lesson table-tennis-tf, không có dữ liệu radio vì bộ xuất cũ chỉ ghi kéo thả. Không coi file đó là bản chụp DOM radio.

Đã nạp extension vào Edge với HTML mô phỏng theo nội dung ảnh Listening Exercise 6B:

- Tái hiện lỗi thuật toán cũ: T/F khớp nhiều nhóm nên không chọn được nhóm duy nhất.
- Đảo thứ tự các câu trong DOM; ghép bằng nội dung hoặc số câu; tự chọn đủ 2 T, 3 F, 4 T, 5 F, 6 F. Giữ nguyên ví dụ câu 1 dù không có trong seed. Không bấm Submit.
- Khi thiếu cả ngữ cảnh lẫn số câu và còn nhiều nhóm trùng lựa chọn, không tự ghép.
- Xuất chẩn đoán chứa controls với lựa chọn T/F, số câu, nội dung Scientists studied và trạng thái radio.
- Chế độ lần lượt từ câu 2: bấm câu 5 bị từ chối, không nhảy đáp án; bấm câu 2 thì chọn T và chuyển tiếp.
- Sửa nội dung câu sau quét: từ chối áp dụng trước khi thay lựa chọn.
- Chạy lại toàn bộ test radio 1.6.5 và điền ô/iframe 1.6.4: đều qua, không có lỗi JavaScript.

Chưa chạy trên phiên Pearson thật. Kho seed giữ nguyên, bao gồm cảnh báo cần đối chiếu từ nguồn.

## Radio và nhận bài nghe 1.6.5

Chạy extension trên Edge với fixture tái tạo chữ trong ảnh Grammar 6.1 Exercise 5. Đây là cấu trúc HTML mô phỏng; ảnh không cung cấp DOM của Pearson thật.

- Tự nhận đúng bài dù nguồn ghi Pronunciation, dựa trên nội dung nhiều câu và metadata section suy đoán.
- Tự tích đủ 4 đáp án, giữ ví dụ, không bấm Submit; thứ tự nhóm câu bị đảo để kiểm tra không ghép theo vị trí.
- Radio có name với span cạnh nút, radio không name theo khối câu, custom role radio và radio trong label đều chọn đúng.
- Chế độ lần lượt: bấm lựa chọn sai trong đúng câu vẫn tích đáp án đúng; bấm số câu cũng được; bấm lặp câu đã làm không tăng chỉ số; bấm sai câu không đổi lựa chọn/đáp án đang chờ.
- Custom radio từ chối click: báo chưa nhận lựa chọn, không tăng chỉ số; thử lại thành công.
- Esc và Dừng thao tác đều dừng; không có lỗi JavaScript trên fixture.
- Chạy lại bộ tự điền 12 ô và hàng đợi qua iframe của 1.6.4 sau thay đổi bộ nhận diện radio.

## Tự điền và bấm ô lần lượt 1.6.4

Nạp extension thực tế vào Edge, dùng HTML mô phỏng từ ảnh bài Grammar 6.1 Ex 2.

- Một lần bấm Tự điền cả bài điền đủ 12 đáp án theo thứ tự; sửa ô có Have you heard đặt nhầm; giữ nguyên has Carlos worked.
- Bỏ qua ví dụ có sẵn cả khi readonly và khi ví dụ vẫn có thể sửa.
- Chế độ bấm ô liên tục điền đủ 12 ô; bấm lặp cùng ô không nhảy đáp án; tự kết thúc khi hết danh sách.
- Chọn câu bắt đầu; Esc và nút Dừng đều dừng chế độ.
- Khi số ô không khớp, tự chuyển sang bấm ô lần lượt.
- Trang từ chối giá trị: không tăng vị trí đáp án; bấm lại có thể tiếp tục. Đổi Activity URL: dừng trước khi điền ô tiếp theo.
- Chuỗi đáp án thống nhất giữa trang chính và iframe Pearson khác origin; dropdown được ghép theo nhãn và không tăng vị trí khi thiếu lựa chọn.
- Nhận bài mới và xóa bảng ghép bài cũ vẫn hoạt động; không có lỗi JavaScript trên fixture.

Chưa kiểm chứng trên tài khoản MyEnglishLab thật. Tự ghép ô dùng thứ tự DOM trong một khung bài đã nhận diện; bài có thứ tự hiển thị khác DOM có thể cần Xem / đổi ghép ô hoặc Bấm ô lần lượt.

## Chuyển bảng đáp án theo bài đang mở trong 1.6.3

Đã nạp extension thực tế vào Edge với trang tái tạo nội dung hội thoại từ ảnh: section 6.1 và Grammar ở hai ô bảng riêng, Exercise 2 trong div; bài nguồn chưa có số Exercise.

- Bấm Nhận bài đang mở chuyển Vocabulary Ex 1 sang đúng Grammar Ex 2 mà không cần bấm gợi ý lần nữa.
- Đối chiếu nhiều đoạn câu hỏi để nhận bài hội thoại có Carlos, Morris, parcel, watch và Marissa; không sửa kho đáp án nguồn để gán số bài cứng.
- Hiển thị 13 câu, giữ ví dụ `has Carlos worked`; quét và điền đúng 12 ô còn lại.
- Bài có nội dung trùng nhau không được tự chọn; liên kết cũ mâu thuẫn với Exercise/skill mới bị bỏ qua.
- Khi trang chuyển sang bài chưa nhận diện được: đóng đáp án cũ, xóa bảng ghép ô đang chờ và báo rõ trạng thái.
- Có thể bấm nhận lại sau đó; không có lỗi JavaScript trong lượt kiểm thử.

Chưa xác minh bản 1.6.3 trên phiên Pearson thật của người dùng. Ảnh kiểm thử đi kèm là trang tái tạo, không phải bằng chứng thực thi trên tài khoản thật.

## Sửa theo chẩn đoán người dùng trong 1.6.2

File chẩn đoán 1.6.1 cho thấy `targets` chỉ có một DIV `.droppableWrapper`, `mapped` rỗng, các từ là DIV `.drag[draggable=true][role=option]` nằm trong hộp `.wordpoolWrapper.ui-draggable`. Đây là bằng chứng thực tế cho lỗi bộ chọn ô rộng và nhận nhầm cơ chế kéo của khối cha.

Đã tái tạo cấu trúc bao ngoài và thuộc tính từ theo file, dùng các ô con `.drop`, `.droppable`, `.drop-target` với chữ gợi ý bằng CSS. File cũ không ghi markup từng ô con; các biến thể ô trong test là phần tái tạo, không phải bản sao toàn bộ DOM thật.

- Chạy mã cũ trên fixture: 1 khối bao ngoài, 0 câu ghép được, tái hiện lỗi đã báo.
- Chạy 1.6.2: nhận 10 ô trong fixture gồm 1 ví dụ fresh và 9 ô cần làm; 8 ô được kéo khi junk đã có, 9 ô khi junk còn trống.
- Nguồn có đúng `data-id` và nhãn như file; chọn cơ chế HTML5 của từ, không phát mousedown làm di chuyển hộp từ.
- Widget chỉ nhận Space: bộ chuyển sang thao tác bàn phím hoàn tất 8 ô.
- Chạy lại bộ kiểm thử jQuery UI thật và HTML5, thay DOM, hủy, iframe, hình có nhãn và bảo vệ ô đã làm.

Chưa xác nhận kết quả sau cập nhật trên tab thật của người dùng. Bộ chẩn đoán đã mở rộng để thu cấu trúc con nếu widget thực tế còn khác các biến thể đã thử.

## Thanh hỗ trợ 1.6.1

Đã kiểm tra extension nạp thực tế trong Edge: nút Xuất chẩn đoán vẫn nhìn thấy và bấm được khi cuộn tới cuối bài trong panel rộng 320 px và popup rộng 420 px; thông báo lỗi dài không che nút. Bấm nút tải được JSON đúng phiên bản và bài đã chọn; khi chưa chọn bài vẫn tải được báo cáo cấu trúc trang. Đóng thông báo không ẩn thanh công cụ. Mục chẩn đoán thu gọn cũ đã bỏ. Đã xem ảnh chụp giao diện sau khi sửa.

Lỗi nhận diện kéo thả trên tài khoản thật mà người dùng báo vẫn cần file chẩn đoán từ trang đó. Bản 1.6.1 tập trung vào việc truy cập và xuất file chẩn đoán; không coi sửa giao diện là đã giải quyết lỗi kéo thả thực tế.

Extension được nạp thực tế vào Edge 154.0.4258.37 bằng profile kiểm thử riêng. Các trang Pearson trong kiểm thử được thay bằng HTML mô phỏng; không dùng tài khoản hoặc nộp bài thật.

Các nhóm kiểm thử đã đạt:

- Đọc đầy đủ 310 bài, 2.026 câu hỏi và 256 câu ví dụ từ dữ liệu nguồn.
- Chọn 10 Unit, số lượng bài đúng, giao diện popup/panel nạp được, không còn các nút luyện tập.
- Điền ô nhập, vùng văn bản có thể sửa, danh sách, radio chuẩn và radio tùy biến có role.
- Tích checkbox, chọn nút hình, nối hai lựa chọn và kéo thả HTML5 khi người dùng chỉ vị trí.
- Truy cập ô trong open Shadow DOM và iframe Pearson khác origin được cấp quyền.
- Phát các sự kiện input/change; bỏ qua ô ẩn, mật khẩu, tìm kiếm, đăng nhập và ô chỉ đọc.
- Bỏ câu ví dụ khỏi danh sách điền; tách đáp án chứa dấu `|` thành nhiều ô.
- Quét → xem bảng ghép → điền/chọn hoàn chỉnh qua giao diện.
- Dừng khi người dùng sửa giá trị sau lúc quét hoặc Exercise trên trang thay đổi.
- Hủy thao tác bằng Esc; không kích hoạt nút Submit trong thử nghiệm chọn vị trí.
- Nhập dữ liệu v11 cũ và v2; gộp dữ liệu; từ chối dữ liệu sai mà giữ nguyên kho; sao lưu khi thay thế.
- Hiển thị nội dung nhập có thẻ HTML dưới dạng chữ, không thực thi thẻ.
- Ghi nhớ bài bằng Activity ID được người dùng liên kết.
- Không có lỗi JavaScript từ các trang giao diện trong lượt kiểm thử cuối.

## Tự kéo thả 1.6.0

Chạy extension thực tế trong Edge với fixture theo dữ liệu bài 6.1 (Vocabulary: health, Exercise 1), jQuery 3.7.1 và jQuery UI 1.13.3 thật. Các thư viện chỉ nằm trong bộ kiểm thử, không thêm vào extension.

- Chỉ fresh được đánh dấu ví dụ. Khi junk chưa được điền, tự kéo đủ 9 từ, bao gồm junk, không cần chỉ vị trí.
- Khi junk đã được người dùng kéo trước, giữ nguyên junk và tự kéo đúng 8 từ còn lại.
- Hộp từ bị đảo thứ tự; hộp từ cũng là vùng droppable để nhận từ trả về; kéo đúng vào ô dựa trên câu xung quanh.
- Tự kéo cả bài bằng một nút qua giao diện; tự kéo từng câu bằng một lệnh riêng.
- Chạy lại khi bài đã đủ đáp án: không kéo lặp, báo các ô đã đúng.
- HTML5 dùng mã token do trình xử lý dragstart của trang đặt; nhận lại ô sau khi widget thay DOM.
- Nhận diện cả ô chỉ có chữ “DRAG ITEM HERE”, không cần thuộc tính data-drop-zone.
- Widget không nhận thao tác: báo 0 ô hoàn tất, không báo thành công giả.
- Ô chứa đáp án khác: giữ nguyên và báo chưa hoàn tất.
- Nút dừng ngắt chuỗi tự động; bài có nhãn Exercise khác bị từ chối trước khi kéo.
- Tự tìm bài kéo thả trong iframe Pearson khác origin được cấp quyền.
- Hình có nhãn alt và ô có số câu: tự kéo hình vào đúng ô.
- Không kích hoạt Submit; không có lỗi JavaScript trên trang kiểm thử.

Chưa kiểm chứng: DOM/widget cụ thể trong tài khoản MyEnglishLab thật, widget chỉ nhận sự kiện trusted, closed Shadow DOM, canvas và iframe ngoài các tên miền được cấp quyền. Không coi kết quả trên fixture là bảo đảm mọi dạng bài Pearson đều tự điền được. Có nút xuất chẩn đoán để bổ sung bộ nhận diện theo widget thực tế.
