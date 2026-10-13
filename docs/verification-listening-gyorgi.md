# 9.2 Listening 4D — đoạn văn Gyorgi

Ảnh ngày 2026-10-13 khớp các mục nguồn `ta2-u9-x-exx-listening-vocab-text`: ví dụ completely normal và bảy ô be outside, fun, all kinds of, hiking, tree house, feeding, enormous. Kho có prompt từng ô nhưng thiếu section/exercise và header Listening.

Catalog bổ sung 9.2 / 4D / Listening, giữ skill vocabulary, type fill_blank và đáp án. Không sửa seed/kho người dùng hoặc thêm nhánh tương tác theo bài. Adapter inline drag hiện có đối chiếu ngữ cảnh từng ô trong cùng đoạn văn, không dùng thứ tự thẻ ở khay.

`tests/listening-gyorgi.cjs` tái hiện đầy đủ đoạn văn trong ảnh thành một itemContent, các thẻ xáo trộn, HTML5 handlers mô phỏng. Nạp extension MV3 thật trên Edge: nhận bài ở Activity ID mới, headerSkill Listening với skill vocabulary được giữ, kéo đủ bảy ô, giữ ví dụ, chỉ làm ô 5, tiếp tục sáu ô còn lại, chạy lại không kéo thêm, header 4C bị từ chối, ignored drop không báo thành công. Kho lưu không đổi; không Save/Submit. Hỗ trợ MEL_TEST_EXTENSION để kiểm thử ZIP đã giải nén.

Ảnh không cung cấp DOM kéo thả thật. Kiểm thử xác nhận nhận diện và hành vi trên trang tái hiện; chưa xác nhận phiên Pearson thực tế.
