$root = 'C:\Users\Uri\Documents\New project\violencia-verbal'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Include *.html,*.js,*.css

$latin1 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.Encoding]::UTF8

foreach ($file in $files) {
  $text = [System.IO.File]::ReadAllText($file.FullName)
  $bytes = $latin1.GetBytes($text)
  $fixed = $utf8.GetString($bytes)
  [System.IO.File]::WriteAllText($file.FullName, $fixed, [System.Text.UTF8Encoding]::new($false))
}

Write-Host "Fixed encoding in $($files.Count) files."
