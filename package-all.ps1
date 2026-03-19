# QuickCopy Pro - Dual Packaging Script (Chromium & Firefox)
$extensionDir = "D:\projects\quickcopy\extension"
$distDir = "D:\projects\quickcopy\dist"

if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }

function Create-Zip($name, $manifestObj) {
    $staging = "$distDir\staging_$name"
    $outputZip = "$distDir\QuickCopy-Pro-$name.zip"
    
    if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
    if (Test-Path $outputZip) { Remove-Item $outputZip }
    
    New-Item -ItemType Directory -Path $staging | Out-Null
    New-Item -ItemType Directory -Path "$staging/icons" | Out-Null

    # Copy shared files
    Copy-Item "$extensionDir/popup.html" "$staging/"
    Copy-Item "$extensionDir/popup.js" "$staging/"
    Copy-Item "$extensionDir/background.js" "$staging/"
    Copy-Item "$extensionDir/content.js" "$staging/"
    Copy-Item "$extensionDir/icons/*" "$staging/icons/"

    # Create browser-specific manifest
    $manifestObj | ConvertTo-Json -Depth 10 | Out-File -FilePath "$staging/manifest.json" -Encoding utf8

    # ZIP with forward slashes
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zipStream = [System.IO.File]::Open($outputZip, [System.IO.FileMode]::Create)
    $zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
    
    $files = Get-ChildItem -Path $staging -Recurse | Where-Object { -not $_.PSIsContainer }
    foreach ($file in $files) {
        $relPath = $file.FullName.Substring($staging.Length + 1).Replace("\", "/")
        $entry = $zipArchive.CreateEntry($relPath, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($file.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close(); $entryStream.Close()
    }
    $zipArchive.Dispose(); $zipStream.Close()
    Remove-Item -Recurse -Force $staging
    Write-Host "Generated QuickCopy-Pro-$name.zip"
}

# Chromium Manifest
$cM = @{
    manifest_version = 3
    name = "QuickCopy Pro Cloud Sync"
    version = "2.0.0"
    description = "Premium cloud clipboard with right-click sync and instant search."
    permissions = @("storage", "contextMenus", "notifications", "identity")
    host_permissions = @("https://quickcopy.pages.dev/*", "https://quickcopy.abhicm019.workers.dev/*", "https://firestore.googleapis.com/*")
    background = @{ service_worker = "background.js" }
    action = @{ default_popup = "popup.html"; default_icon = @{ "16"="icons/icon16.png"; "48"="icons/icon48.png"; "128"="icons/icon128.png" } }
    icons = @{ "16"="icons/icon16.png"; "48"="icons/icon48.png"; "128"="icons/icon128.png" }
}

# Firefox Manifest
$fM = @{
    manifest_version = 3
    name = "QuickCopy Pro Cloud Sync"
    version = "2.0.0"
    description = "Premium cloud clipboard with right-click sync and instant search."
    homepage_url = "https://quickcopy.abhicm019.workers.dev/"
    developer = @{ name = "Abhiram Kodicherla"; url = "https://quickcopy.abhicm019.workers.dev/" }
    permissions = @("storage", "contextMenus", "notifications", "identity")
    oauth2 = @{
        client_id = "122284453797-vm5ghhr7dktfkrhhlroi6hudtbfjakj0.apps.googleusercontent.com"
        scopes = @("openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile")
    }
    host_permissions = @("https://quickcopy.pages.dev/*", "https://quickcopy.abhicm019.workers.dev/*", "https://firestore.googleapis.com/*")
    content_scripts = @(@{ matches = @("https://quickcopy.abhicm019.workers.dev/*"); js = @("content.js") })
    background = @{ scripts = @("background.js") }
    browser_specific_settings = @{
        gecko = @{
            id = "quickcopypro-sync-premium@abhicm019.workers.dev"
            strict_min_version = "142.0"
            data_collection_permissions = @{ required = @("authenticationInfo", "personallyIdentifyingInfo"); optional = @("technicalAndInteraction") }
        }
    }
    action = @{ default_popup = "popup.html"; default_icon = @{ "16"="icons/icon16.png"; "48"="icons/icon48.png"; "128"="icons/icon128.png" } }
    icons = @{ "16"="icons/icon16.png"; "48"="icons/icon48.png"; "128"="icons/icon128.png" }
}

Write-Host "🚀 Building Production Packages..."
Create-Zip "Chromium" $cM
Create-Zip "Firefox" $fM
Write-Host "Success! ZIPs are in D:\projects\quickcopy\dist"
