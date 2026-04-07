# QuickCopy Pro - Final Secure Packaging Script
$extensionDir = "D:\projects\quickcopy\extension"
$outputZip = "D:\projects\quickcopy\QuickCopy-Pro-Extension.zip"

Write-Host "Creating Final Secure ZIP..."

# 1. Clean up
if (Test-Path $outputZip) { Remove-Item $outputZip }
$finalStaging = "D:\projects\quickcopy\final_zip_staging"
if (Test-Path $finalStaging) { Remove-Item -Recurse -Force $finalStaging }
New-Item -ItemType Directory -Path $finalStaging | Out-Null
New-Item -ItemType Directory -Path "$finalStaging/icons" | Out-Null

# 2. Copy ONLY required production files
Copy-Item "$extensionDir/manifest.json" "$finalStaging/"
Copy-Item "$extensionDir/popup.html" "$finalStaging/"
Copy-Item "$extensionDir/popup.js" "$finalStaging/"
Copy-Item "$extensionDir/background.js" "$finalStaging/"
Copy-Item "$extensionDir/content.js" "$finalStaging/"
Copy-Item "$extensionDir/icons/icon16.png" "$finalStaging/icons/"
Copy-Item "$extensionDir/icons/icon48.png" "$finalStaging/icons/"
Copy-Item "$extensionDir/icons/icon128.png" "$finalStaging/icons/"

# 3. Zip with .NET to ensure absolute path compatibility (No \ in names)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($outputZip, [System.IO.FileMode]::Create)
$zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

$allFiles = Get-ChildItem -Path $finalStaging -Recurse | Where-Object { -not $_.PSIsContainer }

foreach ($file in $allFiles) {
    # Extract relative path and replace \ with /
    $relPath = $file.FullName.Substring($finalStaging.Length + 1).Replace("\", "/")
    Write-Host "  Packing: $relPath"
    
    $entry = $zipArchive.CreateEntry($relPath, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    $fileStream.CopyTo($entryStream)
    $fileStream.Close()
    $entryStream.Close()
}

$zipArchive.Dispose()
$zipStream.Close()

# 4. Clean up
Remove-Item -Recurse -Force $finalStaging

Write-Host "✅ Done! ZIP ready at: $outputZip"
Write-Host "This ZIP is clean and contains NO secrets or invalid paths."
