Set objShell = WScript.CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Lấy đường dẫn thư mục hiện tại đang chứa file VBS
strCurrentFolder = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Lấy đường dẫn màn hình Desktop
strDesktop = objShell.SpecialFolders("Desktop")

' Tạo shortcut tên HD-PM.lnk ngoài Desktop
Set objShortcut = objShell.CreateShortcut(strDesktop & "\HD-PM.lnk")

' Tìm đường dẫn trình duyệt (Ưu tiên Chrome, sau đó là Edge)
strChrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
strChrome86 = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
strEdge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

If objFSO.FileExists(strChrome) Then
    objShortcut.TargetPath = strChrome
    objShortcut.Arguments = "--app=""" & strCurrentFolder & "\index.html"""
ElseIf objFSO.FileExists(strChrome86) Then
    objShortcut.TargetPath = strChrome86
    objShortcut.Arguments = "--app=""" & strCurrentFolder & "\index.html"""
ElseIf objFSO.FileExists(strEdge) Then
    objShortcut.TargetPath = strEdge
    objShortcut.Arguments = "--app=""" & strCurrentFolder & "\index.html"""
Else
    ' Fallback nếu không tìm thấy Chrome hay Edge
    objShortcut.TargetPath = strCurrentFolder & "\index.html"
End If

' Cấp quyền thư mục làm việc (giúp các đường dẫn tương đối hoạt động tốt)
objShortcut.WorkingDirectory = strCurrentFolder

' Cài đặt hình ảnh Icon (nếu có file logo.ico trong cùng thư mục)
If objFSO.FileExists(strCurrentFolder & "\logo.ico") Then
    objShortcut.IconLocation = strCurrentFolder & "\logo.ico"
End If

' Cài đặt chạy cửa sổ phóng to mặc định (1 = Bình thường, 3 = Phóng to)
objShortcut.WindowStyle = 3

' Lưu shortcut
objShortcut.Save

MsgBox "Da tao thanh cong Shortcut HD-PM ra Desktop (Che do App Mode)!", vbInformation, "H-DESIGN"
