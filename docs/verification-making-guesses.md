# 9.3 Function: making guesses — Exercise 2

Ảnh ngày 2026-10-13 khớp bảy câu 2–8 trong `ta2-u9-x-exx-certainty-correction`. Trang có câu 1 cố định (chimpanzee/monkey) không nằm trong nguồn, ba câu đúng 2/4/7 và bốn câu còn lại cần sửa. Cùng ví dụ câu 1, điều này phù hợp hướng dẫn có năm câu sai.

Catalog bổ sung 9.3 / 2 / Function: making guesses. Giữ skill grammar; cơ chế headerSkill hiện có dùng Function khi nhận bài. Không đổi seed, đáp án, kho lưu hoặc adapter nhập liệu.

`tests/making-guesses.cjs`: câu và ví dụ tái hiện từ ảnh, expected answers khai báo độc lập; MV3 Edge với handler change mô phỏng. Kiểm tra Activity ID mới, skill grammar/header function, bảy câu đúng vị trí và hoa/thường, lowercase correct ở 2/4/7, ví dụ readonly không đổi, đổi thứ tự hàng, làm riêng câu 7, câu trùng không ghi, header khác từ chối, không Save/Submit, không thay kho lưu. Có MEL_TEST_EXTENSION để kiểm thử ZIP giải nén.

Kiểm thử xác minh nhận diện và điền theo kho, không phải kết quả chấm từ Pearson. Giữ nguyên dấu câu trong đáp án nguồn; không suy diễn tự đổi đáp án theo vị trí dấu chấm trên trang.
