Get-Content .env | Where-Object { $_ -match '=' } | ForEach-Object {
    $parts = $_.Split('=', 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    Write-Host "Adding $key..."
    echo "y" | vercel env add $key
}
