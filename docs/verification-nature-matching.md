# Unit 9 Nature — Exercise 4

Ảnh ngày 2026-10-15 có năm cặp khớp `ta2-u9-x-exx-video-vocab-matching`: living beings → things which are living/alive (ví dụ), graceful → something/someone that moves beautifully, treated with respect → to behave in a respectful way to something/someone, exotic → strange or unusual, often from a foreign country, telly → television.

Catalog bổ sung Nature / Exercise 4, giữ skill vocabulary và đáp án. Bộ nhận diện cũ cần nhiều cụm dài ở vế trái nên không nhận bảng có ba từ đơn. Bổ sung nhận diện bảng hoàn chỉnh: ít nhất bốn cặp có dạng prompt mũi tên, một đáp án mỗi cặp, các nhãn từng cột không trùng, tổng ít nhất 20 từ, toàn bộ nhãn cả hai cột (kể cả ví dụ) xuất hiện trong một frame, tiêu đề không mâu thuẫn và chỉ một bài khớp. Không dùng Activity ID hoặc nhánh riêng theo bài trong engine.

Adapter nối cặp giữ nguyên: yêu cầu cấu trúc matchingGroup và các đường SVG nhất quán, bấm hai đầu, xác nhận đường nối thực tế trong DOM. Không giả lập thành công bằng cách sửa DOM. Không tự Save/Submit.

`tests/nature-matching.cjs` dùng câu từ ảnh; widget và handler SVG được mô phỏng. Đạt trên source và ZIP giải nén: nhận Activity ID mới; chỉ một cột hoặc thiếu ví dụ không nhận; bài trùng và exercise khác bị từ chối; nối bốn cặp; giữ ví dụ; chạy lại không bấm thêm; chỉ làm câu 4; bỏ bảng thiếu/trùng nhãn, sai đường ví dụ hoặc thiếu SVG; handler không nhận và đổi header thì dừng; giữ kho lưu.

Hồi quy đạt: `header-skill.cjs`, `nature-word-list.cjs`. Không có chẩn đoán DOM của bài này; các kiểm thử không xác nhận cấu trúc widget hay kết quả chấm trên phiên Pearson thật. Khi bài đã nhận nhưng chưa nối được, cần xuất chẩn đoán từ bản mới.
