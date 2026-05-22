Option Explicit

Dim objShell, objFSO, objShortcut
Dim strCurrentDir, strSafeFolder, strIconName, strSourceIcon, strDestIcon
Dim strAppName, strWebLink, strBrowserPath, strDesktopPath
Dim arrBrowsers, browser

' ==========================================
' CẤU HÌNH THÔNG TIN ỨNG DỤNG CỦA BẠN TẠI ĐÂY
' ==========================================
strAppName = "HD-PM"               ' Tên ứng dụng (Sẽ dùng làm tên lối tắt và tên thư mục an toàn)
strWebLink = "https://your-web-link.com" ' Link trang web của bạn
strIconName = "logo.ico"                    ' Tên file icon (Nằm cùng thư mục với file cài đặt này)
' ==========================================

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 1. Lấy thư mục hiện tại chứa file VBS này
strCurrentDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' 2. Tạo thư mục an toàn trong C:\Users\Public
strSafeFolder = "C:\Users\Public\" & strAppName
If Not objFSO.FolderExists(strSafeFolder) Then
    objFSO.CreateFolder(strSafeFolder)
End If

' 3. Copy file icon vào thư mục an toàn
strSourceIcon = strCurrentDir & "\" & strIconName
strDestIcon = strSafeFolder & "\" & strIconName

If objFSO.FileExists(strSourceIcon) Then
    objFSO.CopyFile strSourceIcon, strDestIcon, True
Else
    MsgBox "Không tìm thấy file '" & strIconName & "' trong thư mục cài đặt. Vui lòng kiểm tra lại!", 16, "Lỗi Cài Đặt"
    WScript.Quit
End If

' 4. Tìm đường dẫn trình duyệt (Ưu tiên Chrome, sau đó đến Edge)
arrBrowsers = Array( _
    "C:\Program Files\Google\Chrome\Application\chrome.exe", _
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", _
    objShell.ExpandEnvironmentStrings("%LocalAppData%") & "\Google\Chrome\Application\chrome.exe", _
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe", _
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" _
)

strBrowserPath = ""
For Each browser In arrBrowsers
    If objFSO.FileExists(browser) Then
        strBrowserPath = browser
        Exit For
    End If
Next

If strBrowserPath = "" Then
    MsgBox "Không tìm thấy trình duyệt Chrome hoặc Edge trên máy tính của bạn!", 16, "Lỗi Trình Duyệt"
    WScript.Quit
End If

' 5. Tạo Shortcut ngoài Desktop
strDesktopPath = objShell.SpecialFolders("Desktop")
Set objShortcut = objShell.CreateShortcut(strDesktopPath & "\" & strAppName & ".lnk")

objShortcut.TargetPath = strBrowserPath
objShortcut.Arguments = "--app=""" & strWebLink & """"
objShortcut.IconLocation = strDestIcon
objShortcut.Description = "Mở ứng dụng " & strAppName
objShortcut.WindowStyle = 1
objShortcut.Save

' 6. Thông báo thành công
MsgBox "Completed", 64, "Hoàn Tất"

Set objShortcut = Nothing
Set objFSO = Nothing
Set objShell = Nothing
