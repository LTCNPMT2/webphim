# Test API danh gia phim (Giai doan 6). Chay khi server dang chay:
#   powershell -ExecutionPolicy Bypass -File scripts\test-phase6.ps1
# Dung phim 6 (chua co danh gia nao trong du lieu mau) va tu don dep sau khi xong.
$base = "http://localhost:5000/api"
$M = 6
$script:pass = 0; $script:fail = 0

function Api($method, $path, $body = $null, $token = $null) {
  $headers = @{}
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  $req = @{ Method = $method; Uri = "$base$path"; Headers = $headers; UseBasicParsing = $true }
  if ($body -ne $null) {
    $json = $body | ConvertTo-Json -Depth 6 -Compress
    $req["ContentType"] = "application/json"
    $req["Body"] = [Text.Encoding]::UTF8.GetBytes($json)
  }
  try {
    $r = Invoke-WebRequest @req
    return @{ status = [int]$r.StatusCode; body = ($r.Content | ConvertFrom-Json) }
  } catch {
    $status = [int]$_.Exception.Response.StatusCode
    $text = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $text = $_.ErrorDetails.Message }
    else { $text = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() }
    $parsed = $null
    try { $parsed = $text | ConvertFrom-Json } catch {}
    return @{ status = $status; body = $parsed }
  }
}
function Check($name, $actual, $expected) {
  if ($actual -eq $expected) { Write-Host "[OK]   $name" -ForegroundColor Green; $script:pass++ }
  else { Write-Host "[FAIL] $name -> nhan: $actual, mong doi: $expected" -ForegroundColor Red; $script:fail++ }
}

$an   = (Api POST "/auth/login" @{ email = "an@example.com";   password = "password" }).body.data.token
$binh = (Api POST "/auth/login" @{ email = "binh@example.com"; password = "password" }).body.data.token

Write-Host "`n=== Danh gia phim ===" -ForegroundColor Cyan
$r = Api GET "/movies/$M/reviews";                  Check "GET reviews (cong khai)" $r.status 200
Check "  ban dau 0 danh gia" $r.body.data.summary.count 0
$r = Api GET "/movies/99999/reviews";               Check "Phim khong ton tai -> 404" $r.status 404
$r = Api POST "/movies/$M/reviews" @{ rating = 5 }; Check "Chua dang nhap -> 401" $r.status 401
$r = Api POST "/movies/$M/reviews" @{ rating = 6 } $an;  Check "Diem 6 -> 422" $r.status 422
$r = Api POST "/movies/$M/reviews" @{ rating = 0 } $an;  Check "Diem 0 -> 422" $r.status 422
$r = Api GET "/movies/$M/reviews/mine" $null $an
Check "Chua danh gia: mine = null" ($r.body.data.review -eq $null) $true

$r = Api POST "/movies/$M/reviews" @{ rating = 5; comment = "Phim rat hay" } $an
Check "An danh gia 5 sao -> 201" $r.status 201
$r = Api POST "/movies/$M/reviews" @{ rating = 4; comment = "Xem lai thay van hay" } $an
Check "An danh gia lai -> 200 (ghi de)" $r.status 200
Check "  van chi 1 danh gia" (Api GET "/movies/$M/reviews").body.data.summary.count 1
Check "  diem cap nhat = 4" (Api GET "/movies/$M/reviews").body.data.summary.average 4

$r = Api POST "/movies/$M/reviews" @{ rating = 2 } $binh
Check "Binh danh gia 2 sao (khong co nhan xet) -> 201" $r.status 201
$r = Api GET "/movies/$M/reviews"
Check "  co 2 danh gia" $r.body.data.summary.count 2
Check "  trung binh (4+2)/2 = 3" $r.body.data.summary.average 3
Check "  danh sach co ten nguoi dung" ($r.body.data.items[0].full_name -ne $null) $true
$r = Api GET "/movies/$M"
Check "Chi tiet phim cap nhat rating_count = 2" $r.body.data.movie.rating_count 2
$r = Api GET "/movies/$M/reviews?limit=1&page=2"
Check "Phan trang: trang 2 co 1 danh gia" $r.body.data.items.Count 1

Write-Host "`n=== Don dep ===" -ForegroundColor Cyan
$r = Api DELETE "/movies/$M/reviews/mine" $null $an;    Check "An xoa danh gia -> 200" $r.status 200
$r = Api DELETE "/movies/$M/reviews/mine" $null $an;    Check "Xoa lan 2 -> 404" $r.status 404
$r = Api DELETE "/movies/$M/reviews/mine" $null $binh;  Check "Binh xoa danh gia -> 200" $r.status 200
$r = Api GET "/movies/$M"
Check "Phim ve lai 0 danh gia" $r.body.data.movie.rating_count 0

Write-Host "`nKET QUA: $($script:pass) dat, $($script:fail) loi" -ForegroundColor $(if ($script:fail -eq 0) { "Green" } else { "Yellow" })
