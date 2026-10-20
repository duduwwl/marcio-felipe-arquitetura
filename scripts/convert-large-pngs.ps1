Add-Type -AssemblyName System.Drawing

$assetRoot = Join-Path $PSScriptRoot '..\dist\assets'
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$quality = [System.Drawing.Imaging.EncoderParameters]::new(1)
$quality.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
  [System.Drawing.Imaging.Encoder]::Quality, [long]88
)

foreach ($baseName in @('hero-fachada-v2', 'marcio-felipe-hq')) {
  $source = Join-Path $assetRoot "$baseName.png"
  $destination = Join-Path $assetRoot "$baseName.jpg"
  $image = [System.Drawing.Image]::FromFile($source)
  try {
    $image.Save($destination, $jpegCodec, $quality)
  } finally {
    $image.Dispose()
  }
  Get-Item $destination | Select-Object Name, Length
}
