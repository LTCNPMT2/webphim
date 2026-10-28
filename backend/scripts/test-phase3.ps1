# Test tu dong Giai doan 3. Chay khi server dang chay (npm run dev):
#   powershell -ExecutionPolicy Bypass -File scripts\test-phase3.ps1
# Luu y: ASCII-only de khong loi encoding tren Windows PowerShell 5.1
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

Write-Host "`n=== 1. API cong khai ===" -ForegroundColor Cyan
$r = Api GET "/genres";                         Check "GET /genres" $r.status 200
Check "  co 5 the loai" $r.body.data.genres.Count 5
$r = Api GET "/movies?status=now_showing";      Check "GET /movies?status=now_showing" $r.status 200
Check "  6 phim dang chieu" $r.body.data.pagination.total 6
$r = Api GET "/movies?status=coming_soon";      Check "  2 phim sap chieu" $r.body.data.pagination.total 2
$r = Api GET "/movies?genre=kinh-di";           Check "GET /movies?genre=kinh-di (theo slug)" $r.status 200
Check "  2 phim kinh di" $r.body.data.pagination.total 2
$r = Api GET "/movies?genre=2";                 Check "  loc theo id the loai = 2 phim" $r.body.data.pagination.total 2
$r = Api GET "/movies?search=bong";             Check "GET /movies?search=bong" $r.status 200
$r = Api GET "/movies?page=2&limit=3";          Check "  phan trang: trang 2 co 3 phim" $r.body.data.items.Count 3
$r = Api GET "/movies/1";                       Check "GET /movies/1" $r.status 200
Check "  co the loai di kem" ($r.body.data.movie.genres.Count -gt 0) $true
$r = Api GET "/movies/99999";                   Check "GET /movies/99999 -> 404" $r.status 404
$r = Api GET "/movies?status=abc";              Check "GET /movies?status=abc -> 422" $r.status 422
$r = Api GET "/cinemas";                        Check "GET /cinemas" $r.status 200
Check "  2 rap" $r.body.data.cinemas.Count 2
$r = Api GET "/cinemas/1";                      Check "GET /cinemas/1" $r.status 200
Check "  rap 1 co 2 phong" $r.body.data.cinema.rooms.Count 2
$r = Api GET "/showtimes?movie_id=1";           Check "GET /showtimes?movie_id=1" $r.status 200
Check "  co nhom theo rap" ($r.body.data.cinemas.Count -ge 1) $true
$r = Api GET "/showtimes/1";                    Check "GET /showtimes/1" $r.status 200
$r = Api GET "/showtimes?date=2026-13-45";      Check "GET /showtimes?date sai -> 422" $r.status 422

Write-Host "`n=== 2. Phan quyen ===" -ForegroundColor Cyan
$admin = (Api POST "/auth/login" @{ email = "admin@cinema.vn"; password = "password" }).body.data.token
$user  = (Api POST "/auth/login" @{ email = "an@example.com"; password = "password" }).body.data.token
Check "dang nhap admin lay duoc token" ($admin -ne $null) $true
$r = Api POST "/admin/genres" @{ name = "Test Genre" };         Check "Khong token -> 401" $r.status 401
$r = Api POST "/admin/genres" @{ name = "Test Genre" } $user;   Check "User thuong -> 403" $r.status 403

Write-Host "`n=== 3. Admin: the loai / phim ===" -ForegroundColor Cyan
$r = Api POST "/admin/genres" @{ name = "Test Genre" } $admin;  Check "Them the loai -> 201" $r.status 201
$gid = $r.body.data.genre.id
Check "  slug tu sinh" $r.body.data.genre.slug "test-genre"
$r = Api POST "/admin/genres" @{ name = "Test Genre" } $admin;  Check "Them the loai trung -> 409" $r.status 409
$r = Api POST "/admin/movies" @{ title = "Phim Test"; duration_minutes = 0; release_date = "2026-12-01" } $admin
Check "Phim thieu/sai du lieu -> 422" $r.status 422
$r = Api POST "/admin/movies" @{ title = "Phim Test"; duration_minutes = 100; release_date = "2026-12-01"; status = "now_showing"; genre_ids = @($gid) } $admin
Check "Them phim -> 201" $r.status 201
$mid = $r.body.data.movie.id
Check "  slug tu sinh" $r.body.data.movie.slug "phim-test"
Check "  gan dung the loai" $r.body.data.movie.genres[0].id $gid
$r = Api POST "/admin/movies" @{ title = "Phim Test"; duration_minutes = 90; release_date = "2026-12-02"; genre_ids = @(99999) } $admin
Check "The loai khong ton tai -> 400" $r.status 400
$r = Api PUT "/admin/movies/$mid" @{ title = "Phim Test Hai"; status = "now_showing" } $admin
Check "Sua phim -> 200" $r.status 200
Check "  doi ten + slug moi" $r.body.data.movie.slug "phim-test-hai"
$r = Api PUT "/admin/movies/99999" @{ title = "X" } $admin;     Check "Sua phim khong ton tai -> 404" $r.status 404

Write-Host "`n=== 4. Admin: phong chieu ===" -ForegroundColor Cyan
$r = Api POST "/admin/rooms" @{ cinema_id = 1; name = "Phong Test"; rows = 4; cols = 6; vip_rows = @("C"); couple_rows = @("D") } $admin
Check "Them phong -> 201" $r.status 201
$rid = $r.body.data.room.id
Check "  tu sinh 21 ghe (12 thuong + 6 VIP + 3 doi)" $r.body.data.seats.Count 21
$r = Api POST "/admin/rooms" @{ cinema_id = 1; name = "Phong Test"; rows = 4; cols = 6 } $admin
Check "Trung ten phong trong rap -> 409" $r.status 409
$r = Api POST "/admin/rooms" @{ cinema_id = 1; name = "Phong Loi"; rows = 3; cols = 6; vip_rows = @("H") } $admin
Check "Hang VIP ngoai so do -> 400" $r.status 400

Write-Host "`n=== 5. Admin: suat chieu & chong trung gio ===" -ForegroundColor Cyan
$day = (Get-Date).AddDays(10).ToString("yyyy-MM-dd")
# Phim test dai 100 phut + 15 phut don phong => suat 10:00 ket thuc 11:55
$r = Api POST "/admin/showtimes" @{ movie_id = $mid; room_id = $rid; start_time = "$day 10:00"; base_price = 90000 } $admin
Check "Them suat 10:00 -> 201" $r.status 201
$st1 = $r.body.data.showtime.id
$r = Api POST "/admin/showtimes" @{ movie_id = $mid; room_id = $rid; start_time = "$day 11:00"; base_price = 90000 } $admin
Check "Suat 11:00 trung gio -> 409" $r.status 409
$r = Api POST "/admin/showtimes" @{ movie_id = $mid; room_id = $rid; start_time = "$day 09:00"; base_price = 90000 } $admin
Check "Suat 09:00 (ket thuc 10:55, de len 10:00) -> 409" $r.status 409
$r = Api POST "/admin/showtimes" @{ movie_id = $mid; room_id = $rid; start_time = "$day 11:55"; base_price = 90000 } $admin
Check "Suat 11:55 (noi tiep sat gio) -> 201" $r.status 201
$st2 = $r.body.data.showtime.id
$r = Api POST "/admin/showtimes" @{ movie_id = $mid; room_id = $rid; start_time = "2020-01-01 10:00"; base_price = 90000 } $admin
Check "Gio trong qua khu -> 400" $r.status 400
$r = Api POST "/admin/showtimes" @{ movie_id = $mid; room_id = $rid; start_time = "abc"; base_price = 90000 } $admin
Check "Sai dinh dang gio -> 422" $r.status 422
$r = Api GET "/showtimes?movie_id=$mid&date=$day"
Check "Public thay 2 suat cua phim test" $r.body.data.cinemas[0].showtimes.Count 2
Check "  so ghe trong = 21" $r.body.data.cinemas[0].showtimes[0].available_seats 21
$r = Api PUT "/admin/showtimes/$st1" @{ base_price = 95000 } $admin
Check "Doi gia -> 200" $r.status 200
$r = Api PUT "/admin/showtimes/$st1" @{ start_time = "$day 11:00" } $admin
Check "Doi gio de len suat khac -> 409" $r.status 409
$r = Api GET "/admin/showtimes?movie_id=$mid" $null $admin
Check "Admin list suat chieu" $r.body.data.pagination.total 2

Write-Host "`n=== 6. Don dep du lieu test ===" -ForegroundColor Cyan
$r = Api DELETE "/admin/showtimes/$st1" $null $admin; Check "Xoa suat 1" $r.status 200
$r = Api DELETE "/admin/showtimes/$st2" $null $admin; Check "Xoa suat 2" $r.status 200
$r = Api DELETE "/admin/rooms/$rid" $null $admin;     Check "Xoa phong" $r.status 200
$r = Api DELETE "/admin/movies/$mid" $null $admin;    Check "Xoa phim" $r.status 200
$r = Api DELETE "/admin/genres/$gid" $null $admin;    Check "Xoa the loai" $r.status 200
$r = Api GET "/movies/$mid";                          Check "Phim da xoa -> 404" $r.status 404

Write-Host "`nKET QUA: $($script:pass) dat, $($script:fail) loi" -ForegroundColor $(if ($script:fail -eq 0) { "Green" } else { "Yellow" })
