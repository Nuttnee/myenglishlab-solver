# 9.3 Vocabulary: animals — Exercise 1

Ảnh người dùng ngày 2026-10-13 cho thấy chín hình có số: camel, bear, ostrich, cow, pigeon, spider, lion, eagle, butterfly. CAMEL là ví dụ; các hàng ngang dài 5, 4, 7, 3, 6, 6, 4, 5, 9 ô khớp nguồn `ta2-u9-x-exx-animals-crossword`.

Catalog bổ sung section 9.3, exercise 1, sectionTitle Vocabulary: animals. Không sửa seed/kho lưu hoặc adapter crossword. Header đủ để nhận bài khi Activity ID thay đổi.

`tests/animals-crossword.cjs`: danh sách động vật lấy độc lập từ ảnh được đối chiếu với nguồn; lưới mô phỏng theo các hàng trong ảnh, cell DOM cố tình đảo thứ tự, lớp response theo adapter đã hỗ trợ và keyup handler mô phỏng. MV3 Edge kiểm tra nhận bài, điền tám từ/44 ký tự, CAMEL không đổi, trạng thái model nhận keyup, chạy lại không ghi thêm, làm riêng OSTRICH, từ chối sai độ dài/ví dụ/header, không Save/Submit và không đổi kho lưu. Hỗ trợ MEL_TEST_EXTENSION để chạy trên ZIP giải nén.

Không có chẩn đoán DOM của trang này. Kiểm thử xác minh nhận diện và adapter trên lưới tái hiện, không chứng minh Pearson đã ghi nhận hoặc chấm đáp án.
