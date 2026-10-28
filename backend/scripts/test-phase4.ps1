# Test tu dong Giai doan 4 (dat ve). Chay khi server dang chay:
#   powershell -ExecutionPolicy Bypass -File scripts\test-phase4.ps1
# Dung suat chieu 9 (ngay kia, phim "Co Hai Lo Lem", phong IMAX) nen luon o tuong lai.
$base = "http://localhost:5000/api"
$ST = 9
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

$an    = (Api POST "/auth/login" @{ email = "an@example.com";   password = "password" }).body.data.token
$binh  = (Api POST "/auth/login" @{ email = "binh@example.com"; password = "password" }).body.data.token
Check "Dang nhap 2 tai khoan" (($an -ne $null) -and ($binh -ne $null)) $true

Write-Host "`n=== 1. So do ghe ===" -ForegroundColor Cyan
$r = Api GET "/showtimes/$ST/seats"
Check "GET /showtimes/$ST/seats" $r.status 200
Check "  phong IMAX co 75 ghe" $r.body.data.summary.total 75
Check "  ban dau 75 ghe trong" $r.body.data.summary.available 75
$s = $r.body.data.seats
$s1 = $s[0].id; $s2 = $s[1].id; $s3 = $s[2].id
Check "  ghe A1 la ghe thuong gia 90000" $s[0].price 90000
$r = Api GET "/showtimes/99999/seats";   Check "Suat khong ton tai -> 404" $r.status 404
$r = Api GET "/combos";                  Check "GET /combos" $r.status 200
Check "  co 3 combo" $r.body.data.combos.Count 3

Write-Host "`n=== 2. Ma giam gia ===" -ForegroundColor Cyan
$r = Api POST "/promotions/validate" @{ code = "WELCOME10"; subtotal = 200000 } $an
Check "WELCOME10 voi don 200k -> 200" $r.status 200
Check "  giam 20000" $r.body.data.discount_amount 20000
$r = Api POST "/promotions/validate" @{ code = "WELCOME10"; subtotal = 50000 } $an
Check "Don duoi muc toi thieu -> 400" $r.status 400
$r = Api POST "/promotions/validate" @{ code = "KHONGCO"; subtotal = 200000 } $an
Check "Ma khong ton tai -> 400" $r.status 400
$r = Api POST "/promotions/validate" @{ code = "GIAM30K"; subtotal = 200000 } $an
Check "GIAM30K giam co dinh 30000" $r.body.data.discount_amount 30000

Write-Host "`n=== 3. Dat ve & giu ghe ===" -ForegroundColor Cyan
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @($s1) }
Check "Chua dang nhap -> 401" $r.status 401
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @() } $an
Check "Khong chon ghe -> 422" $r.status 422
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @(1,2,3,4,5,6,7,8,9) } $an
Check "Chon 9 ghe -> 422 (toi da 8)" $r.status 422
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @(1) } $an
Check "Ghe thuoc phong khac -> 400" $r.status 400
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @($s1, $s2); combos = @(@{ combo_id = 1; quantity = 2 }); promo_code = "WELCOME10" } $an
Check "An giu A1,A2 + 2 combo + ma WELCOME10 -> 201" $r.status 201
$b1 = $r.body.data.booking
Check "  trang thai pending" $b1.status "pending"
Check "  tam tinh 318000 (2x90000 + 2x69000)" $b1.subtotal 318000
Check "  giam 31800 (10%)" $b1.discount_amount 31800
Check "  tong tien 286200" $b1.total_amount 286200
Check "  co ma ve" ($b1.booking_code -like "MV*") $true
Check "  seconds_left trong khoang 1..600" (($b1.seconds_left -gt 0) -and ($b1.seconds_left -le 600)) $true
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @($s2) } $binh
Check "Binh dat ghe A2 dang bi giu -> 409" $r.status 409
Write-Host "       thong bao: $($r.body.message)"
$r = Api GET "/showtimes/$ST/seats"
Check "So do ghe: 2 ghe dang giu (holding)" $r.body.data.summary.holding 2
$r = Api POST "/bookings" @{ showtime_id = $ST; seat_ids = @($s3) } $binh
Check "Binh dat ghe A3 con trong -> 201" $r.status 201
$b2 = $r.body.data.booking

Write-Host "`n=== 4. Xem don ===" -ForegroundColor Cyan
$r = Api GET "/bookings/$($b1.id)" $null $an
Check "An xem don cua minh -> 200" $r.status 200
Check "  co 2 ghe + 1 combo" (($r.body.data.booking.seats.Count -eq 2) -and ($r.body.data.booking.combos.Count -eq 1)) $true
$r = Api GET "/bookings/$($b1.id)" $null $binh
Check "Binh xem don cua An -> 404" $r.status 404
$r = Api GET "/bookings?status=pending" $null $an
Check "Lich su cua An (pending)" $r.status 200
Check "  co it nhat 1 don" ($r.body.data.pagination.total -ge 1) $true

Write-Host "`n=== 5. Thanh toan ===" -ForegroundColor Cyan
$r = Api POST "/payments" @{ booking_id = $b1.id; method = "mock" } $binh
Check "Binh tra tien don cua An -> 404" $r.status 404
$r = Api POST "/payments" @{ booking_id = $b1.id; method = "momo" } $an
Check "Phuong thuc khong ho tro -> 422" $r.status 422
$r = Api POST "/payments" @{ booking_id = $b1.id; method = "mock"; simulate_fail = $true } $an
Check "Thanh toan that bai gia lap -> 402" $r.status 402
$r = Api GET "/bookings/$($b1.id)" $null $an
Check "  don van pending, thu lai duoc" $r.body.data.booking.status "pending"
$r = Api POST "/payments" @{ booking_id = $b1.id; method = "mock" } $an
Check "Thanh toan thanh cong -> 200" $r.status 200
Check "  trang thai paid" $r.body.data.booking.status "paid"
$pay = $r.body.data.booking.payments
Check "  co 2 ban ghi thanh toan (1 loi, 1 thanh cong)" $pay.Count 2
$r = Api POST "/payments" @{ booking_id = $b1.id; method = "mock" } $an
Check "Thanh toan lai don da tra -> 409" $r.status 409
$r = Api GET "/showtimes/$ST/seats"
Check "So do ghe: 2 ghe da ban (booked)" $r.body.data.summary.booked 2
Check "  1 ghe dang giu (cua Binh)" $r.body.data.summary.holding 1

Write-Host "`n=== 6. Huy ve ===" -ForegroundColor Cyan
$r = Api PUT "/bookings/$($b1.id)/cancel" $null $binh
Check "Binh huy don cua An -> 404" $r.status 404
$r = Api PUT "/bookings/$($b1.id)/cancel" $null $an
Check "An huy ve da thanh toan (suat con 2 ngay) -> 200" $r.status 200
Check "  trang thai cancelled" $r.body.data.booking.status "cancelled"
Check "  thanh toan duoc hoan (refunded)" (@($r.body.data.booking.payments | Where-Object { $_.status -eq "refunded" }).Count) 1
$r = Api PUT "/bookings/$($b1.id)/cancel" $null $an
Check "Huy lan 2 -> 409" $r.status 409
$r = Api GET "/showtimes/$ST/seats"
Check "Ghe A1, A2 duoc nha, chi con 1 ghe giu" ($r.body.data.summary.available -eq 74 -and $r.body.data.summary.holding -eq 1) $true
$r = Api PUT "/bookings/$($b2.id)/cancel" $null $binh
Check "Binh huy don dang giu cho -> 200" $r.status 200
$r = Api GET "/showtimes/$ST/seats"
Check "Tat ca 75 ghe lai trong" $r.body.data.summary.available 75
$r = Api POST "/promotions/validate" @{ code = "WELCOME10"; subtotal = 200000 } $an
Check "Luot dung ma giam gia duoc tra lai (van dung duoc)" $r.status 200

Write-Host "`nKET QUA: $($script:pass) dat, $($script:fail) loi" -ForegroundColor $(if ($script:fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "Tiep theo: chay  node scripts\raceTest.js  de thu 10 yeu cau cung dat 1 ghe."
