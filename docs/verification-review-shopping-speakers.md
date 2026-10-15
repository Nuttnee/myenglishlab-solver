# R3 — Exercise 7B

Ảnh ngày 2026-10-15 khớp bảy câu của `ta2-u9-r3-ex7b`. Giống 7A, trang dùng Grammar: too much / many, enough, very, trong khi nguồn có skill function và title Review 3. Bổ sung verifiedHeaderTitle qua catalog, giữ metadata và đáp án nguồn. Không sửa engine.

Câu 1 binoculars là ví dụ C; câu 2–7 lần lượt C, S, C, S, S, C. `tests/review-shopping-speakers.cjs` tái hiện văn bản từ ảnh, radio C/S trong bố cục hai cột và change handler mô phỏng.

Đạt trên source và ZIP giải nén: nhận ID mới, giữ title/skill/items/kho lưu, chặn metadata đã sửa mâu thuẫn, từ chối bài trùng, chọn sáu câu dù C/S lặp, giữ ví dụ disabled, đổi thứ tự hàng, làm riêng câu 6, từ chối hai câu trùng có radio group khác nhau, dừng khi header chuyển 7A, không Save/Submit. Hồi quy `review-shopping-corrections.cjs` đạt: 7A và 7B không nhận nhầm nhau.

Kiểm thử xác nhận hành vi trên trang mô phỏng, chưa xác nhận lưu/chấm Pearson thật. Seed không đổi.
