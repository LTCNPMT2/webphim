# Test API quan tri (Giai doan 8). Chay khi server dang chay:
#   powershell -ExecutionPolicy Bypass -File scripts\test-phase8.ps1
# Tu don dep du lieu test sau khi xong.
$base = "http://localhost:5000/api"
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

$admin = (Api POST "/auth/login" @{ email = "admin@cinema.vn"; password = "password" }).body.data.token
$an    = (Api POST "/auth/login" @{ email = "an@example.com";   password = "password" }).body.data.token
$adminId = (Api GET "/auth/me" $null $admin).body.data.user.id
$binhId = 3

Write-Host "`n=== 1. Thong ke (Dashboard) ===" -ForegroundColor Cyan
$r = Api GET "/admin/stats" $null $an;                 Check "User thuong -> 403" $r.status 403
$r = Api GET "/admin/stats?days=15" $null $admin;      Check "days=15 -> 422" $r.status 422
$r = Api GET "/admin/stats" $null $admin;              Check "GET /admin/stats -> 200" $r.status 200
$d = $r.body.data
Check "  mac dinh 30 ngay" $d.revenue_by_day.Count 30
Check "  12 thang" $d.revenue_by_month.Count 12
Check "  ngay cuoi cung la hom nay" $d.revenue_by_day[29].date (Get-Date).ToString("yyyy-MM-dd")
Check "  co du cac truong summary" (($d.summary.PSObject.Properties.Name -contains "revenue_total") -and ($d.summary.PSObject.Properties.Name -contains "tickets_total")) $true
Check "  booking_status co du 4 trang thai" (($d.booking_status.PSObject.Properties.Name).Count) 4
Check "  occupancy co ty le" ($d.occupancy.PSObject.Properties.Name -contains "rate") $true
$r = Api GET "/admin/stats?days=7" $null $admin;       Check "days=7 -> 7 ngay" $r.body.data.revenue_by_day.Count 7
$r = Api GET "/admin/stats?days=90" $null $admin;      Check "days=90 -> 90 ngay" $r.body.data.revenue_by_day.Count 90

Write-Host "`n=== 2. Nguoi dung: khoa / mo khoa ===" -ForegroundColor Cyan
$r = Api GET "/admin/users" $null $an;                 Check "User thuong xem danh sach -> 403" $r.status 403
$r = Api GET "/admin/users" $null $admin;              Check "GET /admin/users -> 200" $r.status 200
Check "  co it nhat 3 nguoi dung" ($r.body.data.pagination.total -ge 3) $true
$r = Api GET "/admin/users?search=binh" $null $admin;  Check "Tim 'binh' -> dung 1 nguoi" $r.body.data.pagination.total 1
$r = Api GET "/admin/users?role=admin" $null $admin;   Check "Loc role=admin" ($r.body.data.items[0].role) "admin"
$r = Api GET "/admin/users?role=abc" $null $admin;     Check "role sai -> 422" $r.status 422
$r = Api PUT "/admin/users/$adminId/status" @{ is_active = $false } $admin
Check "Admin tu khoa minh -> 400" $r.status 400
$r = Api PUT "/admin/users/99999/status" @{ is_active = $false } $admin
Check "Khoa nguoi khong ton tai -> 404" $r.status 404
$binhToken = (Api POST "/auth/login" @{ email = "binh@example.com"; password = "password" }).body.data.token
$r = Api PUT "/admin/users/$binhId/status" @{ is_active = $false } $admin
Check "Khoa tai khoan Binh -> 200" $r.status 200
$r = Api POST "/auth/login" @{ email = "binh@example.com"; password = "password" }
Check "  Binh khong dang nhap duoc -> 403" $r.status 403
$r = Api GET "/auth/me" $null $binhToken
Check "  Token cu cua Binh bi chan ngay -> 403" $r.status 403
$r = Api GET "/admin/users?status=locked" $null $admin
Check "  Loc nguoi dung bi khoa" $r.body.data.pagination.total 1
$r = Api PUT "/admin/users/$binhId/status" @{ is_active = $true } $admin
Check "Mo khoa Binh -> 200" $r.status 200
$r = Api POST "/auth/login" @{ email = "binh@example.com"; password = "password" }
Check "  Binh dang nhap lai duoc" $r.status 200

Write-Host "`n=== 3. Don dat ve (admin) ===" -ForegroundColor Cyan
$seatMap = (Api GET "/showtimes/9/seats").body.data
$seat = ($seatMap.seats | Where-Object { $_.status -eq "available" })[0]
$r = Api POST "/bookings" @{ showtime_id = 9; seat_ids = @($seat.id) } $an
Check "An dat 1 ghe (suat 9) -> 201" $r.status 201
$bk = $r.body.data.booking
$r = Api GET "/admin/bookings" $null $an;              Check "User thuong xem don admin -> 403" $r.status 403
$r = Api GET "/admin/bookings?search=$($bk.booking_code)" $null $admin
Check "Admin tim theo ma ve -> 1 don" $r.body.data.pagination.total 1
Check "  hien ten khach" ($r.body.data.items[0].full_name -ne $null) $true
$r = Api GET "/admin/bookings?status=pending" $null $admin;  Check "Loc status=pending" $r.status 200
$today = (Get-Date).ToString("yyyy-MM-dd")
$r = Api GET "/admin/bookings?date_from=$today&date_to=$today&search=$($bk.booking_code)" $null $admin
Check "Loc theo ngay tao (hom nay)" $r.body.data.pagination.total 1
$r = Api GET "/admin/bookings?date_from=abc" $null $admin; Check "date_from sai -> 422" $r.status 422
$r = Api GET "/bookings/$($bk.id)" $null $admin;       Check "Admin xem chi tiet don cua nguoi khac -> 200" $r.status 200
$r = Api PUT "/admin/bookings/$($bk.id)/cancel" $null $admin
Check "Admin huy don -> 200" $r.status 200
Check "  trang thai cancelled" $r.body.data.booking.status "cancelled"
$r = Api PUT "/admin/bookings/$($bk.id)/cancel" $null $admin;  Check "Huy lan 2 -> 409" $r.status 409
$r = Api GET "/showtimes/9/seats"
Check "  ghe duoc tra lai (75 ghe trong)" $r.body.data.summary.available 75

Write-Host "`n=== 4. Combo ===" -ForegroundColor Cyan
$r = Api GET "/admin/combos" $null $an;                Check "User thuong -> 403" $r.status 403
$r = Api POST "/admin/combos" @{ name = ""; price = 5 } $admin;   Check "Combo sai du lieu -> 422" $r.status 422
$r = Api POST "/admin/combos" @{ name = "Combo Test"; description = "Thu nghiem"; price = 55000 } $admin
Check "Them combo -> 201" $r.status 201
$cid = $r.body.data.combo.id
$r = Api PUT "/admin/combos/$cid" @{ price = 60000; is_active = $false } $admin
Check "Sua gia + tat ban -> 200" $r.status 200
Check "  gia moi 60000" $r.body.data.combo.price 60000
Check "  da tat" $r.body.data.combo.is_active 0
$r = Api GET "/combos"
Check "Trang dat ve khong thay combo da tat" (@($r.body.data.combos | Where-Object { $_.id -eq $cid }).Count) 0
$r = Api GET "/admin/combos" $null $admin
Check "Admin van thay combo da tat" (@($r.body.data.combos | Where-Object { $_.id -eq $cid }).Count) 1
$r = Api DELETE "/admin/combos/$cid" $null $admin;     Check "Xoa combo -> 200" $r.status 200
$r = Api DELETE "/admin/combos/$cid" $null $admin;     Check "Xoa lai -> 404" $r.status 404

Write-Host "`n=== 5. Ma giam gia ===" -ForegroundColor Cyan
$promo = @{ code = "test50"; description = "Thu nghiem"; discount_type = "percent"; discount_value = 50; max_discount = 40000; min_order = 50000; start_date = "2026-01-01 00:00"; end_date = "2030-12-31 23:59"; usage_limit = 10; is_active = $true }
$r = Api GET "/admin/promotions" $null $an;            Check "User thuong -> 403" $r.status 403
$r = Api POST "/admin/promotions" $promo $admin;       Check "Them ma -> 201" $r.status 201
$promoId = $r.body.data.promotion.id
Check "  ma tu viet hoa" $r.body.data.promotion.code "TEST50"
Check "  trang thai active" $r.body.data.promotion.state "active"
$r = Api POST "/admin/promotions" $promo $admin;       Check "Them trung ma -> 409" $r.status 409
$bad = $promo.Clone(); $bad.code = "BAD1"; $bad.discount_value = 150
$r = Api POST "/admin/promotions" $bad $admin;         Check "Giam 150% -> 422" $r.status 422
$bad = $promo.Clone(); $bad.code = "BAD2"; $bad.end_date = "2025-01-01 00:00"
$r = Api POST "/admin/promotions" $bad $admin;         Check "Ngay ket thuc truoc ngay bat dau -> 422" $r.status 422
$bad = $promo.Clone(); $bad.code = "x"
$r = Api POST "/admin/promotions" $bad $admin;         Check "Ma qua ngan -> 422" $r.status 422
$r = Api POST "/promotions/validate" @{ code = "TEST50"; subtotal = 200000 } $an
Check "Ma moi dung duoc ngay: 50% toi da 40000" $r.body.data.discount_amount 40000
$upd = $promo.Clone(); $upd.discount_value = 10; $upd.is_active = $false
$r = Api PUT "/admin/promotions/$promoId" $upd $admin;     Check "Sua + tat ma -> 200" $r.status 200
Check "  trang thai inactive" $r.body.data.promotion.state "inactive"
Check "  code khong doi" $r.body.data.promotion.code "TEST50"
$r = Api POST "/promotions/validate" @{ code = "TEST50"; subtotal = 200000 } $an
Check "Ma da tat khong dung duoc -> 400" $r.status 400
$r = Api DELETE "/admin/promotions/$promoId" $null $admin; Check "Xoa ma chua dung -> 200" $r.status 200
$r = Api DELETE "/admin/promotions/$promoId" $null $admin; Check "Xoa lai -> 404" $r.status 404

Write-Host "`nKET QUA: $($script:pass) dat, $($script:fail) loi" -ForegroundColor $(if ($script:fail -eq 0) { "Green" } else { "Yellow" })
