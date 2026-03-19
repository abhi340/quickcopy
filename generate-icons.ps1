# QuickCopy Pro - Placeholder Icon Generator
# This script creates 16, 48, and 128px placeholder PNGs (solid blue squares)
$iconPath = "D:\projects\quickcopy\extension\icons"
if (-not (Test-Path $iconPath)) { New-Item -ItemType Directory -Path $iconPath }

Add-Type -AssemblyName System.Drawing

function Create-PlaceholderIcon($size, $filename) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $color = [System.Drawing.Color]::FromArgb(255, 99, 102, 241) # Indigo
    $brush = New-Object System.Drawing.SolidBrush($color)
    $g.FillRectangle($brush, 0, 0, $size, $size)
    
    # Optional: Draw a "Q" on it
    $font = New-Object System.Drawing.Font("Arial", ($size * 0.6))
    $textBrush = [System.Drawing.Brushes]::White
    $g.DrawString("Q", $font, $textBrush, ($size * 0.1), ($size * 0.1))

    $bmp.Save("$iconPath\$filename", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "✅ Created $filename"
}

Create-PlaceholderIcon 16 "icon16.png"
Create-PlaceholderIcon 48 "icon48.png"
Create-PlaceholderIcon 128 "icon128.png"
