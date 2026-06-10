$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("c:\Users\realme\Downloads\MOSJE\mosje_chat\MOSJE_Chatbot_BRD.docx")
$text = $doc.Content.Text
$text | Out-File -FilePath "c:\Users\realme\Downloads\MOSJE\mosje_chat\BRD_content.txt" -Encoding UTF8
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Done"
