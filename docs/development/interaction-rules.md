# Quy tắc tự làm

Giữ nền v11 và seed study nguyên vẹn. Quy tắc thao tác dựa trên cấu trúc điều khiển; không thêm nhánh theo lesson ID để sửa từng bài.

## Nhận bài và điều khiển

1. Đối chiếu liên kết người dùng, Activity ID duy nhất trong seed, section/exercise hoặc nhiều đoạn nội dung. Loại tiêu đề mâu thuẫn. Activity ID là dữ liệu nhận bài, không quyết định cách kéo/điền.
2. Bài được chọn thủ công có thể dùng khi tự nhận chưa có kết quả; gắn với frame, URL, section và exercise lúc chọn. Vẫn từ chối kết quả nhận bài khác hoặc tiêu đề trái với nguồn.
3. Quét input/textarea/contenteditable, select, radio và checkbox. Loại ô bị khóa, ẩn hoặc ví dụ khi có bằng chứng. Lấy chữ cục bộ, số câu, vị trí ô, lựa chọn và nhóm điều khiển.
4. Áp dụng các phép ghép chắc chắn kể cả chưa ghép đủ cả bài. Báo riêng các câu còn thiếu; không tự chuyển danh sách đáp án từ câu đầu sau khi đã làm một phần.
5. Nếu không có thao tác native, thử nguồn/đích kéo thả. Có nguồn mà không tìm được đích thì xuất chẩn đoán. Chỉ tự bật bấm ô lần lượt khi có input/select/radio hỗ trợ.

## Ghép câu

- Đọc text node có khoảng cách giữa các phần tử để tránh “5Most”. Loại script/style, vùng extension và chữ ẩn khỏi ngữ cảnh.
- Số/chữ phải có bằng chứng cấu trúc: thuộc tính số câu, chữ/số độc lập, số đầu câu hoặc ol/li. Hỗ trợ ol type A/a, start, reversed và li value. Không lấy chữ A trong “A lot…” hoặc I trong câu tiếng Anh làm nhãn.
- Nhiều ô: xét vị trí trong cùng câu và dữ liệu 1a/1b/1c. Ghép riêng trường hợp có/không có ví dụ trong danh sách điều khiển.
- So chữ ngay trước/sau ô; so nội dung cục bộ hoặc đoạn đủ dài khi nguồn bị cắt. Khi bỏ ngoặc chú thích làm mất động từ gợi ý, vẫn thử bản prompt gốc.
- Ghép hai chiều: đáp án trỏ tới một ô duy nhất và ô không bị nhiều đáp án tranh chấp. T/F, chữ và nhãn lặp phải được phân biệt bằng câu/nhóm.
- Chỉ dùng thứ tự để lấp khoảng **giữa** ít nhất hai câu đã ghép độc lập trong danh sách đầy đủ có thứ tự nhất quán. Không kéo dài suy đoán ra trước/sau các mốc.
- Giữ nguyên đáp án khi điền. Chuẩn hóa khoảng trắng/dấu nháy/hoa thường chỉ để đối chiếu; T/True và F/False tương đương nhưng hai lựa chọn cùng khớp vẫn bị từ chối.

## Thao tác và kiểm tra

- Native: setter/sự kiện hoặc click; đọc lại giá trị/checked sau thao tác. Đây là xác nhận DOM, chưa chứng minh app đã ghi nhận hoặc lưu lên máy chủ.
- Checkbox: ghép các đáp án của câu; chỉ bỏ distractor trong chính nhóm đã ghép đủ. Không dùng riêng số câu để bỏ tích ở nhóm khác.
- Kéo thả: quét lại nguồn/đích sau mỗi lượt; ưu tiên HTML5 cho token draggable, chuột cho token có jQuery UI của chính nó, bàn phím cho cấu trúc có bằng chứng hỗ trợ. Không lấy ui-draggable của hộp từ làm bằng chứng token hỗ trợ chuột.
- Hai token cùng chữ chỉ dùng thay thế nhau khi là token văn bản HTML draggable trong hộp từ đã nhận diện, không có hình. Còn thiếu bằng chứng thì từ chối.
- Phân loại: từ trong prompt là nguồn, nhãn nhóm là đích; nhóm vẫn được nhận diện khi đã chứa nhiều từ.
- Xác nhận tại ô đích sau thao tác, đồng thời hỗ trợ ô bị thay DOM. Có thay đổi DOM nhưng chưa xác nhận thì không thử tiếp một cơ chế khác. Không sửa chữ trực tiếp để giả lập kết quả kéo thả.
- Ví dụ theo nguồn không được làm. Câu người dùng đã điền không tự biến thành ví dụ. Kéo lại bỏ qua ô đã đúng; ô kéo có đáp án khác được giữ nguyên.

## Phạm vi còn thiếu

Custom listbox, ánh xạ lựa chọn A/B/C tới chữ đáp án, click-token, sortable, hidden radio không có label, đích kéo chưa có dấu hiệu nhận diện, closed Shadow DOM/canvas và sự kiện trusted cần thêm adapter và bằng chứng DOM/event thực tế. Không suy rộng nhãn loại bài thành bảo đảm hỗ trợ.

Mỗi sửa tiếp theo cần fixture độc lập, trường hợp mơ hồ phải từ chối và kiểm tra trạng thái ứng dụng ngoài DOM nếu có thể. Fixture sinh từ chính seed chỉ kiểm tra tính nhất quán dữ liệu; không đo tỷ lệ thành công trên Pearson.

## Cụm ô ký tự · 1.8.1

- Nhận diện ô maxlength/size=1 hoặc ô nhỏ có chữ cố định đóng khung bên cạnh. Nhóm theo chuỗi ô liền nhau trong DOM, ngắt khi gặp văn bản câu, điều khiển khác hoặc xuống dòng rõ ràng. Không dùng lesson ID hoặc vị trí cố định trong trang.
- Chữ gợi ý lấy từ input readonly/disabled/aria-readonly hoặc phần tử chữ có hình dạng ô. Chỉ các ô sửa được nhận giá trị mới.
- Một cụm là một mục tiêu của bộ ghép chung. Kiểm tra độ dài và từng chữ cố định; vẫn kiểm tra đối chiếu hai chiều, ngữ cảnh và số câu. Không dùng thứ tự để vượt qua mẫu chữ không khớp.
- Đáp án có khoảng trắng được thử theo số ô thực tế: giữ khoảng trắng nếu có ô, bỏ khoảng trắng nếu trang chỉ có ô chữ. Không tự bỏ dấu nối/dấu nháy.
- Trước và sau thao tác kiểm tra chữ gợi ý, trạng thái ô, URL và hủy. Giá trị bị từ chối giữ đáp án hiện tại; chữ điền một phần có thể được tiếp tục khi thử lại.
- Tự làm, bấm lần lượt và chỉ vị trí đều gọi lib/letters.js. Bộ quét xuất letterPattern/letterCount và maxLength để chẩn đoán.


## Sắp xếp thẻ từ thành câu — bổ sung 1.9.0

- Mỗi câu phải có đúng một khay từ và một vùng nhận trong cùng `draggableJumbledWords`. Cùng một ID trên hai vùng không dùng để định vị.
- Ghép duy nhất theo multiset gồm cả từ trong khay và từ đã đặt. Đếm đầy đủ từ lặp. Thiếu/thừa từ hoặc nhiều câu cùng bộ từ thì từ chối tự ghép.
- Loại câu ví dụ bằng cấu trúc điều khiển, không coi tất cả đáp án đã có là ví dụ. Chỉ tiếp tục phần đầu câu đúng thứ tự; phần đầu sai được giữ nguyên và báo chưa hoàn tất.
- Sortable: kiểm tra instance và connectWith, phát mouse events cho thẻ, cập nhật geometry qua public refreshPositions khi placeholder làm đổi kích thước, thả vào cuối câu. Không sửa DOM hoặc gọi callback nhận đáp án trực tiếp.
- HTML5: dùng một DataTransfer qua dragstart/dragover/drop/dragend nếu không có instance Sortable. Không đổi sang cơ chế khác sau một lần thả thất bại.
- Sau từng từ, đọc lại toàn bộ nhóm. Đích phải đúng tiền tố mong đợi, nguồn phải giảm đúng một thẻ. Không chỉ kiểm tra câu có chứa đáp án.
- Cơ chế dùng chung mọi bài có cấu trúc tương ứng; seed giữ nguyên. Chỉ xác minh trạng thái trang, không khẳng định Pearson đã lưu/chấm.


## Danh mục nhận diện đã xác minh — 1.9.1

Thông tin tiêu đề và Activity ID xác minh từ trang thật được lưu riêng trong lib/catalog.js. Bộ đọc áp dụng cho cả kho lưu cũ và seed, không thay đổi đáp án, không ghi đè metadata người dùng đã sửa trái với danh mục. Engine thao tác không phân nhánh theo lesson ID. Không dùng tiêu đề phỏng đoán để tự xác nhận số bài.


## Nhãn vào hình — 1.9.2

Chỉ dùng suy luận chuỗi RESPONSE khi: bài matching/drag_image, prompt Picture, hàng A… liên tiếp, mỗi hàng một đáp án duy nhất, ít nhất một ví dụ; một wrapper chứa đủ N ô mã chung tiền tố RESPONSE_1…N; ID không trùng; khay wordpoolWrapper cùng tiền tố có đủ bộ nhãn; ví dụ cố định trên trang khớp hàng và đáp án nguồn. Từ chối nếu có nhãn cục bộ hoặc kết quả ghép mạnh hơn mâu thuẫn. Phải có duy nhất một nhóm phù hợp. Mã data-id của thẻ chỉ xác minh nó thuộc khay, không được xem là đáp án.

Ghép theo số trong mã ô, không theo vị trí DOM hoặc thứ tự ô còn trống. Giữ các ô đã có nội dung khác. Chỉ tính thành công khi sự kiện của trang làm xuất hiện đáp án tại ô đã ghép. Keyboard fallback có thể focus region tabindex=-1; nếu phải thêm tabindex tạm thì khôi phục ngay. Không sửa trực tiếp nội dung ô hoặc model đáp án.


## Crossword — 1.10.0

- Tách `.crossword input.cw` khỏi bộ điền input/letter-group thường. Không nhập cả từ vào một ô hoặc bật picker tuần tự.
- Gom nhóm theo `response-RESPONSE_N`. Một phần tử có nhiều nhóm là ô dùng chung, không nhân bản ô. `cw-first` là số câu, không ghi.
- Sắp ô theo tọa độ hiển thị: cùng hàng → across; cùng cột → down. Yêu cầu khoảng cách liên tục/đều, số ô bằng độ dài đáp án đã bỏ khoảng trắng/gạch nối. Không tin số chữ trong prompt vì nguồn có thể đếm sai.
- So toàn bộ ví dụ và ô khóa; kiểm tra mọi giao điểm đồng thuận trước khi viết bất kỳ ô nào. Từ chối số nhóm/số từ/hướng/độ dài mâu thuẫn.
- Khi điền chỉ ghi ô sửa được, phát input/change/keyup và kiểm tra giá trị giữ lại. Ô giao nhau chỉ ghi một lần. Mỗi bước kiểm tra chữ vừa thay đổi, nút Dừng, tiêu đề/trang và cấu trúc lưới.
- Cùng quy tắc cho mọi lưới có cấu trúc này, không ràng buộc bài 6.3. Bài khác dạng hoặc nhóm từ không đọc được sẽ báo lý do, không tự đoán thứ tự.


## Xếp câu theo thứ hạng — 1.10.1

- Nhãn type=ordering không quyết định cơ chế. Chỉ chọn adapter từ thành câu khi có nhóm draggableJumbledWords trên trang; trường hợp khác dùng adapter kéo thả/đích riêng.
- Khi mỗi hàng có prompt là câu và answer là số nguyên, số là vị trí đích, không phải chữ cần kéo. Yêu cầu toàn bộ thứ hạng là hoán vị 1…N; dùng answer để xếp, không dùng row.n hay thứ tự mảng nguồn.
- Chuyển prompt thành nội dung nguồn chỉ khi cả bộ thẻ, ví dụ cố định và chuỗi đích RESPONSE đã đối chiếu đầy đủ. Bộ câu thiếu/thừa, thứ hạng trùng, mã đích trùng hoặc ví dụ sai đều không dùng phép ghép này.
- Tái sử dụng phép đối chiếu response series của kéo nhãn vào hình; không nhánh theo lesson ID. Giữ các điều kiện bảo vệ và kiểm tra sự kiện kéo trước khi tính hoàn thành.
- Seed không đổi. Chỉ áp dụng diễn giải đáp án dạng thứ hạng ở adapter kéo câu; ô nhập số/select nếu có vẫn dùng dạng đáp án gốc.

## Nối đường kẻ / chẩn đoán 1.10.2

- Không coi mọi type=matching là kéo thả. Nhận bài theo cả hai vế không phải bằng chứng về cách điều khiển widget.
- Cần ít nhất ba cặp nội dung hai vế, tối thiểu 75%, duy nhất so với kho và không mâu thuẫn số bài để nhận bằng cụm từ ngắn.
- Xuất chẩn đoán đọc các endpoint ứng viên từ nội dung bài chọn, ancestor, cấu trúc vùng matching/connect/pair, SVG/canvas và tên sự kiện. Vẫn thu vùng khả nghi khi chưa chọn bài.
- Không tự click dựa trên sự giống chữ; phải có bằng chứng cách nối và cách kiểm tra cặp thực trước khi thêm adapter. Bản 1.10.2 chưa triển khai tự nối đường kẻ.

## Tự nối hai cột 1.11.0

- Cấu trúc thật từ JSON (8): matchingGroup trái/phải, matchingElement nhận click, matchingLines chứa SVG. Không viết trực tiếp hiddenInputs hoặc tự vẽ đường nối.
- Cần duy nhất một bảng khớp đủ các cặp nội dung; giữ nguyên từ trong ngoặc. Không suy cặp bằng số hàng, thứ tự DOM hay hậu tố ID.
- Đọc đường SVG qua getPointAtLength và getScreenCTM để xác định hai endpoint theo tọa độ màn hình. Mỗi endpoint chỉ thuộc một đường. Trạng thái matched phải đồng nhất với các đường đọc được.
- Ví dụ/ô khóa phải đã nối đúng trước khi chạy. Cặp khác đáp án giữ nguyên; chỉ nối hai đầu chưa được sử dụng. Sau mỗi cặp, yêu cầu đúng đường và đúng trạng thái trước khi tiếp tục.
- Không tự làm lại nếu click không được trang ghi nhận. Dừng khi đổi bài, nội dung nút đổi, nút bị thay giữa hai click hoặc khi người dùng hủy.
- Xác minh SVG/DOM không đồng nghĩa máy chủ Pearson đã lưu/chấm.

## Tiêu đề bài ôn tập

Nhận R1/R2/R3 hoặc Review N bên cạnh tên chủ đề; chuẩn hóa khoảng trắng và hoa/thường. Không lấy R2 nằm trong một câu văn làm section. Khi cùng trang có nhiều mã section mâu thuẫn, dừng nhận và không cho chạy qua lựa chọn thủ công. Không thay đổi kho đáp án để khắc phục lỗi đọc tiêu đề.

## Chủ đề header và kỹ năng

Nhóm chủ đề rõ ràng trong sectionTitle được dùng để đối chiếu header trước skill. Skill vẫn mô tả bài nghe/đọc/ngữ pháp trong kho. Mã activity không được vượt qua mâu thuẫn section/exercise/header. Catalog chỉ bổ sung thông tin đã xác minh, giữ nguyên đáp án và metadata người dùng đã sửa khác; bỏ dấu suy đoán ở trường đã xác minh.

## Dòng câu chứa ô nhập số

Khi xếp thứ tự bằng số, lấy lineContext từ dòng có đúng một control, tách bằng BR hoặc khối HTML, giữ span inline. Không dùng ngữ cảnh chung của cả đoạn để suy vị trí; không nội suy theo thứ tự ô cho câu chưa ghép chắc chắn. Vẫn giữ context/slot của đoạn cho các bài điền chỗ trống khác.
