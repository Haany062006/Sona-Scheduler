param (
    [Parameter(Mandatory=$true)]
    [string]$PdfPath,
    [Parameter(Mandatory=$true)]
    [string]$OutputPath,
    [Parameter(Mandatory=$true)]
    [string]$Mode, # "syllabus" or "arrears"
    [int]$MaxPages = 15
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
}[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $null = $netTask.Wait(-1)
    return $netTask.Result
}

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation.Diagnostics, ContentType = WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null

$lang = [Windows.Globalization.Language]::new('en-GB')
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("sona_ocr_" + [System.Guid]::NewGuid().ToString("N"))
[System.IO.Directory]::CreateDirectory($tempDir) | Out-Null

try {
    $pyScript = @"
import os, sys
pdf_path = sys.argv[1]
out_dir = sys.argv[2]
max_pages = int(sys.argv[3])
mode = sys.argv[4]

with open(pdf_path, 'rb') as f:
    data = f.read()

start = 0
img_count = 0
from PIL import Image
import io

while start < len(data) and img_count < max_pages:
    soi = data.find(b'\xff\xd8\xff', start)
    if soi == -1:
        break
    eoi = data.find(b'\xff\xd9', soi)
    if eoi == -1:
        break
    img_data = data[soi:eoi+2]
    img_count += 1
    
    out_file = os.path.join(out_dir, f'page_{img_count}.jpg')
    im = Image.open(io.BytesIO(img_data))
    
    # In Sona arrears PDF, pages are landscape printed as portrait (need 90 deg clockwise rotation)
    if mode == 'arrears' or (im.width < im.height and im.width > 2000):
        im = im.rotate(90, expand=True)
    
    im.save(out_file, 'JPEG', quality=95)
    start = eoi + 2

print(img_count)
"@
    $pyScriptPath = Join-Path $tempDir "extract.py"
    [System.IO.File]::WriteAllText($pyScriptPath, $pyScript)

    $pageCountStr = python $pyScriptPath $PdfPath $tempDir $MaxPages $Mode
    $pageCount = [int]($pageCountStr.Trim())

    $pagesData = @()

    for ($p = 1; $p -le $pageCount; $p++) {
        $imgPath = Join-Path $tempDir "page_$p.jpg"
        if (-not (Test-Path $imgPath)) { continue }

        $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath)) ([Windows.Storage.StorageFile])
        $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $ocrResult = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

        $pageLines = @()
        foreach ($line in $ocrResult.Lines) {
            $pageLines += $line.Text
        }

        $pageObj = @{
            page = $p
            lines = $pageLines
        }

        if ($Mode -eq 'arrears') {
            $compactWords = @()
            foreach ($line in $ocrResult.Lines) {
                foreach ($w in $line.Words) {
                    $compactWords += ,@($w.Text, [int]$w.BoundingRect.X, [int]$w.BoundingRect.Y)
                }
            }
            $pageObj.words = $compactWords
        }

        $pagesData += $pageObj
    }

    $resultObj = @{
        mode = $Mode
        totalPages = $pageCount
        pages = $pagesData
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $json = ConvertTo-Json -InputObject $resultObj -Depth 6 -Compress
    [System.IO.File]::WriteAllText($OutputPath, $json, $utf8NoBom)
    Write-Host "SUCCESS: Written $OutputPath"

} finally {
    try {
        [System.IO.Directory]::Delete($tempDir, $true)
    } catch {}
}
