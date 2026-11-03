# 5.1 Listening Exercise 7 — complete the sentences

Ảnh ngày 2026-11-03 xác nhận header 5.1 Listening, Exercise 7 và ba câu có ô nhập phần kết. Các ngữ cảnh khớp `ta2-u5-5.1-exx-tobigutt-complete` (image149), nguồn thiếu exercise/sectionTitle và ghi skill reading.

Chỉ bổ sung catalog exercise 7, sectionTitle Listening; giữ skill, câu và đáp án nguồn. HeaderSkill và bộ ghép/điền native hiện có được dùng lại; không sửa adapter, seed, kho lưu hoặc liên kết activity ID.

`tests/tourist-completion.cjs` dùng ngữ cảnh ảnh và ba đáp án kỳ vọng khai báo độc lập, handler change mô phỏng. MV3 Edge chạy trên source và ZIP giải nén: nhận header với ID chưa biết, điền đủ cụm dài vào ô hẹp, xử lý xuống dòng ở câu 1, không thêm dấu chấm vào ô; đảo DOM, làm riêng câu 2; từ chối câu trùng và header 6B. Metadata người dùng mâu thuẫn được giữ, bài trùng không tự nhận; không Save/Submit hay sửa kho lưu.

Chưa có audio/DOM/handler thật. Kết quả chỉ kiểm chứng điền đáp án nguồn, chưa xác nhận từng từ nghe hoặc kết quả chấm Pearson.
