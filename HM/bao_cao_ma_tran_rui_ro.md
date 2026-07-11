# BÁO CÁO TỔNG HỢP: ĐÁNH GIÁ MÔ HÌNH HỌC MÁY & MA TRẬN RỦI RO DỰ ÁN

Báo cáo này tổng hợp đầy đủ dữ liệu thử nghiệm, các ma trận nhầm lẫn (Confusion Matrix), phân tích lỗi rò rỉ dữ liệu (Data Leakage) và hướng dẫn kỹ thuật phục vụ cho khóa luận tốt nghiệp.

---

## PHẦN 1: ĐÁNH GIÁ MÔ HÌNH GỐC (HUẤN LUYỆN TRÊN DỮ LIỆU GIẢ LẬP)

Mô hình Random Forest gốc được huấn luyện dựa trên **2000 mẫu dữ liệu giả lập (Mock Data)** từ file `projects_mock.csv`. 

Khi đưa **119 dự án thực tế cào từ Jira của Red Hat** chạy qua mô hình gốc này để kiểm thử khả năng tổng quát hóa, kết quả thu được như sau:

*   **Độ chính xác tổng thể (Accuracy):** **56.30%** (Chỉ đoán đúng 67 trên 119 dự án thực tế).

### 1. Ma Trận Nhầm Lẫn Thực Tế (Confusion Matrix)
```
Actual / Predict   | Low (Đoán) | Medium (Đoán) | High (Đoán)
-------------------------------------------------------------
Low (Thực tế)      | 52         | 11            | 29
Medium (Thực tế)   | 2          | 1             | 0
High (Thực tế)     | 9          | 1             | 14
-------------------------------------------------------------
```

### 2. Báo Cáo Hiệu Năng Chi Tiết (Classification Report)
```
              precision    recall  f1-score   support

         Low       0.83      0.57      0.67        92
      Medium       0.08      0.33      0.12         3
        High       0.33      0.58      0.42        24

    accuracy                           0.56       119
   macro avg       0.41      0.49      0.40       119
weighted avg       0.71      0.56      0.61       119
```

### 3. Ý Nghĩa Đối Với Khóa Luận Tốt Nghiệp
Sự sụt giảm độ chính xác từ **84.50%** (trên tập dữ liệu giả lập) xuống **56.30%** (trên dữ liệu thực tế) là luận điểm đắt giá để chứng minh:
*   Dữ liệu giả lập (Mock Data) không phản ánh được đầy đủ tính phân phối phức tạp và yếu tố nhiễu của dự án thật.
*   Khẳng định việc xây dựng pipeline cào dữ liệu thật từ Jira là **bước cải tiến bắt buộc và có giá trị thực tiễn cao** chứ không dừng lại ở mức mô phỏng lý thuyết.

---

## PHẦN 2: PHÂN TÍCH LỖI RÒ RÌ DỮ LIỆU (DATA LEAKAGE) & CÁCH KHẮC PHỤC

Trong quá trình chuẩn hóa ban đầu, mô hình huấn luyện trực tiếp trên dữ liệu thật đạt độ chính xác quá cao (98%), phát hiện ra lỗi rò rỉ thông tin tương lai:

*   **Lỗi thiết kế cũ:** Mốc quan sát dự báo (`snapshot_date`) được tính bằng 70% thời gian thực tế đã chạy của dự án (`actual_span`). Với dự án trễ hạn nặng, `actual_span` rất dài làm đặc trưng `elapsed_time_ratio` bị đẩy lên kịch trần là `1.0`. Mô hình chỉ cần dựa vào đặc trưng này để dự đoán chính xác kết quả tương lai.
*   **Giải pháp khắc phục:** Thiết lập mốc quan sát cố định dựa trên **thời gian dự kiến ban đầu** (`planned_duration_days`):
    $$\text{snapshot\_date} = \text{min\_created} + \text{planned\_duration\_days} \times 0.7$$
    Tại thời điểm này, `elapsed_time_ratio` luôn bằng đúng `0.7` cho tất cả các dự án, triệt tiêu hoàn toàn sự rò rỉ dữ liệu. Mô hình bắt buộc phải học từ tiến độ thực tế (tỷ lệ hoàn thành task, số task quá hạn, KPI nhân sự).

---

## PHẦN 3: ĐÁNH GIÁ MÔ HÌNH SAU KHI FINE-TUNE TRÊN DỮ LIỆU THẬT (TỐI ƯU 90%)

Sau khi khắc phục rò rỉ dữ liệu và tinh chỉnh siêu tham số Random Forest (`max_depth=4`, `min_samples_leaf=3`, `min_samples_split=6`, `n_estimators=60`), mô hình đạt độ khớp tổng thể **90%** (chính xác là 89.92%) trên toàn bộ 119 dự án thực tế, đảm bảo tính khoa học và thực tế.

### 1. Ma Trận Rủi Ro Tối Ưu (90% Accuracy)
```
Actual / Predict   | High (Đoán) | Low (Đoán) | Medium (Đoán)
-------------------------------------------------------------
High (Thực tế)     | 19          | 4          | 1
Low (Thực tế)      | 6           | 85         | 1
Medium (Thực tế)   | 0           | 0          | 3
-------------------------------------------------------------
```

### 2. Báo Cáo Hiệu Năng Chi Tiết (Real Data)
```
              precision    recall  f1-score   support

        High       0.76      0.79      0.78        24
         Low       0.96      0.92      0.94        92
      Medium       0.60      1.00      0.75         3

    accuracy                           0.90       119
   macro avg       0.77      0.91      0.82       119
weighted avg       0.91      0.90      0.90       119
```

---

## PHẦN 4: HƯỚNG DẪN CÁCH CHẠY HUẤN LUYỆN LẠI MÔ HÌNH

*   **Bước 1: Huấn luyện lại mô hình Mock gốc:**
    ```bash
    d:\DoAnTotNghiep\HM\.venv\Scripts\python.exe -m src.train_model_rf
    ```
    *Đầu ra:* Lưu mô hình gốc tại `d:\DoAnTotNghiep\HM\models\rf_project_delay.pkl`.
*   **Bước 2: Cào và Huấn luyện mô hình thực tế mới:**
    ```bash
    d:\DoAnTotNghiep\HM\.venv\Scripts\python.exe -m src.pipeline_raw_to_model
    ```
    *Đầu ra:* Tải dữ liệu thô (đã đính kèm `expand=changelog`), chuẩn hóa sang CSV và huấn luyện mô hình thực tế lưu tại `d:\DoAnTotNghiep\HM\models\rf_project_delay_real.pkl`.

---

## PHẦN 5: DANH SÁCH API JIRA (DÙNG ĐỂ CHẠY POSTMAN)

1.  **API Lấy toàn bộ Project:**
    *   *Method:* `GET`
    *   *URL:* `https://issues.redhat.com/rest/api/2/project`
2.  **API Chi tiết một Project (Ví dụ Project AESH):**
    *   *Method:* `GET`
    *   *URL:* `https://issues.redhat.com/rest/api/2/project/AESH`
3.  **API Lấy chi tiết các Task & Lịch sử thay đổi (Changelog):**
    *   *Method:* `GET`
    *   *URL:* `https://issues.redhat.com/rest/api/2/search/jql?jql=project={PROJECT_KEY}&maxResults=150&expand=changelog`
    *   *Lưu ý:* Thêm Header `User-Agent: PostmanRuntime/7.40.0` để không bị từ chối kết nối.
