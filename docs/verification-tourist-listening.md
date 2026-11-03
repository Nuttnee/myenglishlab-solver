# 5.1 Listening Exercise 6B — Tobi Gutt

Ảnh ngày 2026-11-03 có header 5.1 Listening, Exercise 6B và sáu câu T/F. Nguồn `ta2-u5-5.1-exx-tobigutt-tf` chứa câu 2–6 nhưng thiếu exercise/sectionTitle, skill là reading. Câu 1 T là ví dụ có sẵn và không có trong seed. Câu 4 trong ảnh kết thúc “was hot”, nguồn bị cắt sau Montana.

Bổ sung catalog exercise 6B, sectionTitle Listening, giữ skill reading và đáp án nguồn T/F/F/F/T. Không thêm activity ID, nhánh thao tác riêng hoặc sửa seed. HeaderSkill hiện có dùng tiêu đề Listening; bộ ghép radio hiện có khớp câu 4 theo phần nội dung nguồn còn thấy.

`tests/tourist-listening.cjs` dùng câu từ ảnh, đáp án kỳ vọng độc lập và handler change mô phỏng. Chạy MV3 Edge trên source và ZIP giải nén: nhận header với activity ID chưa biết; năm lựa chọn đúng theo nguồn; ví dụ giữ nguyên; đảo DOM; làm riêng câu 6; câu bị nhân đôi không tự chọn; header đổi sang 6A bị từ chối. Metadata người dùng mâu thuẫn được giữ; bài trùng không tự nhận; không Save/Submit hay sửa kho lưu.

Chưa có audio/DOM/handler thật trong lượt này. Kiểm thử không chứng minh đáp án nguồn đã được Pearson chấm đúng hoặc lưu lên máy chủ.
