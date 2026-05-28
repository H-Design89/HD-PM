# Hướng Dẫn Thiết Lập Google Sheets Làm Database
*(Áp dụng cho HD-PM và các ứng dụng tương tự của HD Solution)*

Ứng dụng của bạn hiện đã được lập trình để có thể lấy/lưu dữ liệu trực tiếp với đám mây (Google Sheets). Để kích hoạt tính năng này, bạn cần thực hiện đúng 4 bước dưới đây:

## Bước 1: Tạo Google Sheets
1. Truy cập vào [Google Sheets](https://sheets.google.com/) và tạo một Bảng tính trống mới.
2. Đặt tên bảng tính tùy ý (VD: `HD-PM Database`).
3. Bạn **KHÔNG CẦN** tạo bảng hay điền dữ liệu bằng tay. Code bên dưới sẽ tự động tạo Sheet `Users` và `Links` khi bạn lưu dữ liệu lần đầu tiên.

## Bước 2: Thêm Apps Script
1. Trên thanh menu của Google Sheets, chọn **Tiện ích mở rộng** (Extensions) > **Apps Script**.
2. Một cửa sổ code mới sẽ hiện ra. Xóa toàn bộ mã mặc định có sẵn (`function myFunction() {...}`).
3. Copy và dán toàn bộ đoạn mã dưới đây vào:

```javascript
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = ss.getSheetByName("Users");
  var linksSheet = ss.getSheetByName("Links");
  
  if (!usersSheet || !linksSheet) {
    // Trả về dữ liệu trống nếu sheet chưa tồn tại
    return ContentService.createTextOutput(JSON.stringify({users: [], links: []}))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  var usersData = getSheetData(usersSheet);
  var linksData = getSheetData(linksSheet);
  
  // Chuyển tags từ chuỗi (ngăn cách bởi dấu phẩy) thành mảng
  for (var i = 0; i < linksData.length; i++) {
    if (linksData[i].tags) {
      linksData[i].tags = linksData[i].tags.split(",").map(function(t) { return t.trim(); }).filter(function(t) { return t; });
    } else {
      linksData[i].tags = [];
    }
  }

  var result = {
    users: usersData,
    links: linksData
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
                       .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Lưu Users
    if (data.users) {
      var usersSheet = ss.getSheetByName("Users");
      if (!usersSheet) {
        usersSheet = ss.insertSheet("Users");
      }
      saveDataToSheet(usersSheet, data.users, ["id", "name", "password", "role"]);
    }
    
    // Lưu Links
    if (data.links) {
      var linksSheet = ss.getSheetByName("Links");
      if (!linksSheet) {
        linksSheet = ss.insertSheet("Links");
      }
      
      // Chuyển tags từ mảng thành chuỗi để lưu
      var linksToSave = JSON.parse(JSON.stringify(data.links)); // Deep copy
      for (var i = 0; i < linksToSave.length; i++) {
        if (linksToSave[i].tags && Array.isArray(linksToSave[i].tags)) {
          linksToSave[i].tags = linksToSave[i].tags.join(", ");
        } else {
          linksToSave[i].tags = "";
        }
      }
      saveDataToSheet(linksSheet, linksToSave, ["id", "title", "url", "desc", "note", "tags", "type", "icon", "createdAt", "starred"]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Không có dữ liệu hoặc chỉ có header
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var value = row[j];
      if (value !== "") {
        obj[header] = value.toString(); 
      }
    }
    result.push(obj);
  }
  
  return result;
}

function saveDataToSheet(sheet, dataArray, headerKeys) {
  sheet.clearContents();
  
  if (dataArray.length === 0) {
     sheet.appendRow(headerKeys);
     return;
  }
  
  var rows = [headerKeys];
  
  for (var i = 0; i < dataArray.length; i++) {
    var row = [];
    var obj = dataArray[i];
    for (var j = 0; j < headerKeys.length; j++) {
      var val = obj[headerKeys[j]];
      row.push(val !== undefined ? val : "");
    }
    rows.push(row);
  }
  
  sheet.getRange(1, 1, rows.length, headerKeys.length).setValues(rows);
}
```

## Bước 3: Triển khai (Deploy) API
1. Bấm nút **Lưu** (biểu tượng đĩa mềm) hoặc ấn `Ctrl + S`.
2. Bấm nút **Triển khai** (Deploy) màu xanh ở góc trên bên phải màn hình > Chọn **Lần triển khai mới** (New deployment).
3. Ở khung "Chọn loại" (Select type), bấm hình bánh răng, chọn **Ứng dụng web** (Web app).
4. **THIẾT LẬP RẤT QUAN TRỌNG:** Ở dòng **Quyền truy cập** (Who has access), bạn bắt buộc phải chọn **Bất kỳ ai** (Anyone).
5. Bấm **Triển khai** (Deploy).
6. Google sẽ yêu cầu "Cấp quyền truy cập", bạn hãy: Đăng nhập tài khoản > Chọn "Nâng cao" (Advanced) > "Đi tới dự án (Không an toàn)" và bấm nút "Cho phép" (Allow).
7. Cuối cùng, bạn sẽ nhận được một đường link **URL của Ứng dụng Web** (Web App URL). **Hãy copy đường link đó.**

## Bước 4: Khai báo vào Code của bạn
1. Mở file `data.js` bằng VS Code (hoặc Notepad).
2. Tìm dòng code ở đầu file:
   `const GOOGLE_SHEET_API_URL = "";`
3. Dán đường link bạn vừa copy vào giữa 2 dấu ngoặc kép. Ví dụ:
   `const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfyc.../exec";`
4. Lưu file `data.js` lại.

## Bước 5: Đẩy dữ liệu lên Cloud lần đầu
1. Mở file `index.html` của bạn lên để vào web.
2. Web sẽ hiển thị thông báo "Lỗi kết nối Cloud, đang dùng dữ liệu offline" (do trên Sheet chưa có dữ liệu gì). Đừng lo lắng, hãy bấm OK.
3. Đăng nhập bằng tài khoản Admin.
4. Chuyển sang thẻ **Quản trị**.
5. Bấm nút **Lưu Lên Cloud**. Đợi khoảng 2-3 giây cho hệ thống xử lý.
6. Mở Google Sheets của bạn ra xem thử. Bạn sẽ thấy 2 sheet `Users` và `Links` đã tự động được tạo và chứa đầy đủ dữ liệu từ file `data.js` cũ!

*Lưu ý: Kể từ bây giờ, mọi người truy cập vào trang web của bạn đều sẽ gọi dữ liệu trực tiếp từ file Google Sheets này. Khi bạn thêm/sửa/xóa Link hoặc User và bấm Lưu Lên Cloud, dữ liệu cũng sẽ cập nhật ngay lập tức.*
