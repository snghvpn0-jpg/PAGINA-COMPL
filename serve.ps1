$ErrorActionPreference = 'Stop'

$root = (Resolve-Path $PSScriptRoot).Path
$logPath = Join-Path $PSScriptRoot 'server.log'
Set-Content -LiteralPath $logPath -Value "Starting server at $(Get-Date -Format o)"

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 4173)
$listener.Start()
Add-Content -LiteralPath $logPath -Value "Listening on 127.0.0.1:4173"

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css' { 'text/css; charset=utf-8' }
    '.js' { 'application/javascript; charset=utf-8' }
    '.png' { 'image/png' }
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.svg' { 'image/svg+xml' }
    '.mp4' { 'video/mp4' }
    default { 'application/octet-stream' }
  }
}

function Send-Response {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body
  )

  $stream = $Client.GetStream()
  $writer = [System.IO.StreamWriter]::new($stream, [Text.Encoding]::ASCII, 1024, $true)
  $writer.NewLine = "`r`n"
  $writer.Write("HTTP/1.1 $StatusCode $StatusText`r`n")
  $writer.Write("Content-Type: $ContentType`r`n")
  $writer.Write("Content-Length: $($Body.Length)`r`n")
  $writer.Write("Connection: close`r`n`r`n")
  $writer.Flush()
  $stream.Write($Body, 0, $Body.Length)
  $stream.Flush()
  $Client.Close()
}

try {
  while ($true) {
    if (-not $listener.Pending()) {
      Start-Sleep -Milliseconds 50
      continue
    }

    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) {
        $client.Close()
        continue
      }

      while ($true) {
        $header = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($header)) { break }
      }

      $parts = $requestLine.Split(' ')
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
      if ($rawPath -eq '/') { $rawPath = '/index.html' }
      $relative = [Uri]::UnescapeDataString($rawPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar))
      $filePath = [IO.Path]::GetFullPath((Join-Path $root $relative))

      if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
        $body = [Text.Encoding]::UTF8.GetBytes('Forbidden')
        Send-Response -Client $client -StatusCode 403 -StatusText 'Forbidden' -ContentType 'text/plain; charset=utf-8' -Body $body
        continue
      }

      if (Test-Path -LiteralPath $filePath -PathType Leaf) {
        $body = [IO.File]::ReadAllBytes($filePath)
        Send-Response -Client $client -StatusCode 200 -StatusText 'OK' -ContentType (Get-ContentType $filePath) -Body $body
      }
      else {
        $fallback = Join-Path $root 'index.html'
        $body = [IO.File]::ReadAllBytes($fallback)
        Send-Response -Client $client -StatusCode 200 -StatusText 'OK' -ContentType 'text/html; charset=utf-8' -Body $body
      }
    }
    catch {
      try {
        $body = [Text.Encoding]::UTF8.GetBytes('Internal Server Error')
        Send-Response -Client $client -StatusCode 500 -StatusText 'Internal Server Error' -ContentType 'text/plain; charset=utf-8' -Body $body
      } catch {}
    }
  }
}
finally {
  Add-Content -LiteralPath $logPath -Value "Stopping server at $(Get-Date -Format o)"
  $listener.Stop()
}
