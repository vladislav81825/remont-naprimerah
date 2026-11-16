$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $root 'data\site-config.json'
$dataPath = Join-Path $root 'data\articles.json'
$imgDir = Join-Path $root 'assets\images'

$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$articles = Get-Content -LiteralPath $dataPath -Raw -Encoding UTF8 | ConvertFrom-Json

$brandUpper = ([string]$config.brand).ToUpper()
$domain = ([string]$config.url) -replace '^https?://', ''
$catMap = @{}
for ($i = 0; $i -lt $config.categories.Count; $i++) {
  $c = $config.categories[$i]
  $catMap[[string]$c.slug] = [pscustomobject]@{
    label = [string]$c.label
    color = [string]$c.color
    index = $i + 1
  }
}

function Get-Color([string]$hex, [int]$alpha = 255) {
  $h = $hex.TrimStart('#')
  return [System.Drawing.Color]::FromArgb(
    $alpha,
    [Convert]::ToInt32($h.Substring(0, 2), 16),
    [Convert]::ToInt32($h.Substring(2, 2), 16),
    [Convert]::ToInt32($h.Substring(4, 2), 16)
  )
}

function Wrap-Text($graphics, [string]$text, $font, [float]$maxWidth) {
  $words = $text -split '\s+'
  $lines = New-Object System.Collections.Generic.List[string]
  $current = ''
  foreach ($word in $words) {
    $test = if ($current) { "$current $word" } else { $word }
    $w = $graphics.MeasureString($test, $font).Width
    if ($w -le $maxWidth -or -not $current) {
      $current = $test
    }
    else {
      $lines.Add($current)
      $current = $word
    }
  }
  if ($current) { $lines.Add($current) }
  return $lines
}

$serif = 'Georgia'
$sans = 'Segoe UI'
$generated = 0
$reused = 0
$skipped = 0
$failed = 0

if (-not (Test-Path -LiteralPath $imgDir)) {
  New-Item -ItemType Directory -Path $imgDir -Force | Out-Null
}

foreach ($article in $articles) {
  $slug = [string]$article.slug
  if (-not $slug) { continue }

  $cover = [string]$article.cover
  if ($cover) {
    $coverPath = Join-Path $root ($cover -replace '/', '\')
    if (Test-Path -LiteralPath $coverPath) { $skipped++; continue }
  }

  $targetRel = "assets/images/$slug-cover.jpg"
  $target = Join-Path $root ($targetRel -replace '/', '\')
  if (Test-Path -LiteralPath $target) {
    $article.cover = $targetRel
    $reused++
    continue
  }

  try {
    $cat = $catMap[[string]$article.category]
    if (-not $cat) {
      $cat = [pscustomobject]@{ label = ''; color = '#c2410c'; index = 0 }
    }

    $bmp = [System.Drawing.Bitmap]::new(1200, 675)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $bgBrush = [System.Drawing.SolidBrush]::new((Get-Color '#1c1917'))
    $g.FillRectangle($bgBrush, 0, 0, 1200, 675)

    $gridPen = [System.Drawing.Pen]::new((Get-Color '#ffffff' 14), 1)
    for ($x = 0; $x -le 1200; $x += 60) {
      $g.DrawLine($gridPen, [float]$x, [float]0, [float]$x, [float]675)
    }
    for ($y = 0; $y -le 675; $y += 60) {
      $g.DrawLine($gridPen, [float]0, [float]$y, [float]1200, [float]$y)
    }

    $accentBrush = [System.Drawing.SolidBrush]::new((Get-Color $cat.color))
    $g.FillRectangle($accentBrush, 0, 0, 12, 675)

    $num = ('{0:D2}' -f [int]$cat.index)
    $numFont = [System.Drawing.Font]::new($serif, 230, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $numBrush = [System.Drawing.SolidBrush]::new((Get-Color $cat.color 45))
    $g.DrawString($num, $numFont, $numBrush, [float]905, [float]320)

    $labelFont = [System.Drawing.Font]::new($sans, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $label = ([string]$cat.label).ToUpper()
    $labelBrush = [System.Drawing.SolidBrush]::new((Get-Color $cat.color))
    $g.DrawString($label, $labelFont, $labelBrush, [float]64, [float]48)
    $labelWidth = $g.MeasureString($label, $labelFont).Width
    $linePen = [System.Drawing.Pen]::new((Get-Color $cat.color 120), 3)
    $g.DrawLine($linePen, [float]64, [float]88, [float](64 + $labelWidth), [float]88)

    $title = [string]$article.title
    if (-not $title) { $title = $slug }

    $maxWidth = 900
    $fontSize = 68
    $titleFont = $null
    $lines = $null
    while ($fontSize -ge 40) {
      if ($titleFont) { $titleFont.Dispose() }
      $titleFont = [System.Drawing.Font]::new($serif, $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
      $lines = Wrap-Text $g $title $titleFont $maxWidth
      $tooWide = $false
      foreach ($l in $lines) {
        if ($g.MeasureString($l, $titleFont).Width -gt ($maxWidth + 24)) { $tooWide = $true }
      }
      if ($lines.Count -le 4 -and -not $tooWide) { break }
      $fontSize -= 4
    }

    if ($lines.Count -gt 4) {
      $lines = $lines.GetRange(0, 4)
      $lines[3] = $lines[3].TrimEnd() + '...'
    }

    $lineHeight = $fontSize * 1.18
    $total = $lines.Count * $lineHeight
    $top = 150
    if ($total -lt 390) { $top = 150 + ((390 - $total) / 2) }

    $titleBrush = [System.Drawing.SolidBrush]::new((Get-Color '#f5f5f4'))
    $yPos = $top
    foreach ($line in $lines) {
      $g.DrawString($line, $titleFont, $titleBrush, [float]64, [float]$yPos)
      $yPos += $lineHeight
    }

    $footerPen = [System.Drawing.Pen]::new((Get-Color '#ffffff' 38), 1)
    $g.DrawLine($footerPen, [float]64, [float]586, [float]1136, [float]586)

    $footFont = [System.Drawing.Font]::new($sans, 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $footBrush = [System.Drawing.SolidBrush]::new((Get-Color '#d6d3d1' 200))
    $g.DrawString($brandUpper, $footFont, $footBrush, [float]64, [float]602)

    $domFont = [System.Drawing.Font]::new($sans, 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $domBrush = [System.Drawing.SolidBrush]::new((Get-Color '#a8a29e' 200))
    $domWidth = $g.MeasureString($domain, $domFont).Width
    $g.DrawString($domain, $domFont, $domBrush, [float](1136 - $domWidth), [float]604)

    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $encParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]88)
    $bmp.Save($target, $jpegCodec, $encParams)

    $article.cover = $targetRel
    $generated++

    $encParams.Dispose()
    $titleFont.Dispose()
    $numFont.Dispose()
    $labelFont.Dispose()
    $footFont.Dispose()
    $domFont.Dispose()
    $bgBrush.Dispose()
    $accentBrush.Dispose()
    $numBrush.Dispose()
    $labelBrush.Dispose()
    $titleBrush.Dispose()
    $footBrush.Dispose()
    $domBrush.Dispose()
    $gridPen.Dispose()
    $linePen.Dispose()
    $footerPen.Dispose()
    $g.Dispose()
    $bmp.Dispose()
  }
  catch {
    $failed++
    Write-Warning ("{0}: {1}" -f $slug, $_.Exception.Message)
    if ($g) { $g.Dispose() }
    if ($bmp) { $bmp.Dispose() }
  }
}

$json = $articles | ConvertTo-Json -Depth 10
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($dataPath, $json, $utf8)

Write-Output ("Generated: {0}, reused: {1}, already had: {2}, failed: {3}" -f $generated, $reused, $skipped, $failed)
