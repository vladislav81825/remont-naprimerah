Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root 'assets\images\logo-og.jpg'
$width = 1200
$height = 630

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$paper = [System.Drawing.ColorTranslator]::FromHtml('#f4efe5')
$ink = [System.Drawing.ColorTranslator]::FromHtml('#20251f')
$accent = [System.Drawing.ColorTranslator]::FromHtml('#b24628')
$line = [System.Drawing.ColorTranslator]::FromHtml('#cec3b1')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#6d7065')

$g.Clear($paper)

$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20, 32, 37, 31), 1)
for ($x = 0; $x -lt $width; $x += 48) {
  $g.DrawLine($gridPen, $x, 0, $x, $height)
}
for ($y = 0; $y -lt $height; $y += 48) {
  $g.DrawLine($gridPen, 0, $y, $width, $y)
}
$gridPen.Dispose()

$linePen = New-Object System.Drawing.Pen($line, 1)
$accentPen = New-Object System.Drawing.Pen($accent, 2)
$inkPen = New-Object System.Drawing.Pen($ink, 2)

$g.DrawRectangle($linePen, 54, 52, 1092, 526)
$g.DrawLine($accentPen, 54, 126, 1146, 126)
$g.DrawLine($linePen, 760, 126, 760, 578)

$g.DrawRectangle($inkPen, 96, 82, 34, 34)
$g.DrawPath($accentPen, (New-Object System.Drawing.Drawing2D.GraphicsPath))
$house = New-Object System.Drawing.Drawing2D.GraphicsPath
$house.AddLine(101, 106, 113, 97)
$house.AddLine(113, 97, 125, 106)
$house.AddLine(125, 106, 125, 116)
$house.AddLine(125, 116, 101, 116)
$house.CloseFigure()
$g.DrawPath($accentPen, $house)
$house.Dispose()

$mono = New-Object System.Drawing.Font('Consolas', 13, [System.Drawing.FontStyle]::Regular)
$serifBig = New-Object System.Drawing.Font('Georgia', 62, [System.Drawing.FontStyle]::Bold)
$serifMid = New-Object System.Drawing.Font('Georgia', 29, [System.Drawing.FontStyle]::Regular)
$sans = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Regular)
$sansSmall = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Regular)
$monoSmall = New-Object System.Drawing.Font('Consolas', 11, [System.Drawing.FontStyle]::Regular)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$accentBrush = New-Object System.Drawing.SolidBrush($accent)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$paperBrush = New-Object System.Drawing.SolidBrush($paper)

$g.DrawString('ПРАКТИЧЕСКИЙ ЖУРНАЛ О РЕМОНТЕ', $mono, $accentBrush, 150, 88)
$g.DrawString('Ремонт', $serifBig, $inkBrush, 92, 166)
$g.DrawString('на примерах', $serifBig, $accentBrush, 92, 238)
$g.DrawString('Технологии, планировки и сметы', $serifMid, $inkBrush, 96, 338)
$g.DrawString('без переделок и лишних затрат.', $serifMid, $inkBrush, 96, 380)
$g.DrawString('170 разборов  ·  8 рубрик  ·  сметы 2026', $monoSmall, $mutedBrush, 96, 464)

$g.FillRectangle($accentBrush, 804, 170, 292, 230)
$g.DrawString('01', $serifBig, $paperBrush, 828, 190)
$g.DrawString('ЧЕРТЁЖ', $monoSmall, $paperBrush, 836, 282)
$g.DrawString('БЕЗ ОШИБОК', $monoSmall, $paperBrush, 836, 306)
$g.DrawString('remont.naprimerah.ru', $sansSmall, $mutedBrush, 804, 454)

$stampPen = New-Object System.Drawing.Pen($accent, 1)
$g.DrawEllipse($stampPen, 988, 380, 104, 104)
$g.DrawEllipse($stampPen, 996, 388, 88, 88)
$g.DrawString('2026', $monoSmall, $accentBrush, 1018, 420)
$g.DrawString('СМЕТЫ', $monoSmall, $accentBrush, 1014, 442)

$g.Dispose()

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 88L)
$bmp.Save($target, $encoder, $params)
$bmp.Dispose()

Write-Output "OG image: $target"
