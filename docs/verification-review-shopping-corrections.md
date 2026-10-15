# R3 — Exercise 7A

Ảnh ngày 2026-10-15 khớp sáu câu của `ta2-u9-r3-ex7a`. Nguồn đã có section R3, exercise 7A, sectionTitle Review 3 và skill function. Trang lại dùng header Grammar: too much / many, enough, very, khiến bộ đối chiếu kỹ năng từ chối bài dù nội dung khớp.

Catalog bổ sung `verifiedHeaderTitle` để nhận nhóm Grammar từ tiêu đề đã thấy; giữ nguyên Review 3, function và đáp án. Trường bổ sung chỉ được áp dụng qua cùng bộ chặn mâu thuẫn metadata hiện có, không thay metadata người dùng đã chỉnh khác nguồn. Không đổi parser R3 hoặc engine ô nhập, không dùng Activity ID riêng.

Các ô 2–6: Do you have one of these in a larger size / Are you looking for anything in particular / It doesn't fit me / Can you just sign here, please / Where's the fitting room. Câu mẫu 1 giữ nguyên. Đáp án nguồn không thêm dấu câu cuối vì trang đã có dấu ngoài ô.

`tests/review-shopping-corrections.cjs` chạy MV3 Edge với sáu câu từ ảnh, bố cục hai cột và change handler mô phỏng. Đạt trên source và ZIP giải nén: nhận đúng với ID mới, giữ skill/title/answers và kho lưu, không bổ sung header khi metadata đã sửa mâu thuẫn, từ chối hai bài cùng khớp, điền năm câu nguyên hoa/thường, giữ mẫu, đổi thứ tự hàng, chỉ làm câu 6, từ chối câu trùng, dừng khi đổi sang 7B, không Save/Submit.

Hồi quy `header-skill.cjs` và `review-detection.cjs` đạt, seed không đổi. Kiểm thử trên trang mô phỏng chưa xác nhận lưu/chấm Pearson thật.
