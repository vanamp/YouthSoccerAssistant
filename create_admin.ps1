$envFile = Get-Content ".env.local"
$envVars = @{}
foreach ($line in $envFile) {
    if ($line -match "^([^=]+)=(.*)$") {
        $envVars[$matches[1]] = $matches[2].Trim('"', "'")
    }
}

$supabaseUrl = $envVars["NEXT_PUBLIC_SUPABASE_URL"]
$supabaseKey = $envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

$email = "admin@ysa.com"
$password = "admin123"

Write-Host "Signing up $email..."
$signupUrl = "$supabaseUrl/auth/v1/signup"
$headers = @{
    "apikey" = $supabaseKey
    "Content-Type" = "application/json"
}
$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $signupUrl -Method Post -Headers $headers -Body $body
    $userId = $response.user.id
    Write-Host "Signup successful. User ID: $userId"
} catch {
    Write-Host "Signup failed (user might already exist)."
}

Write-Host "Logging in to get token..."
$loginUrl = "$supabaseUrl/auth/v1/token?grant_type=password"
try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -Headers $headers -Body $body
    $token = $response.access_token
    $userId = $response.user.id
    Write-Host "Login successful."
    
    Write-Host "Updating profile to admin..."
    $updateUrl = "$supabaseUrl/rest/v1/profiles?id=eq.$userId"
    $updateHeaders = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }
    $updateBody = @{
        role = "admin"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri $updateUrl -Method Patch -Headers $updateHeaders -Body $updateBody
    Write-Host "Profile successfully updated to ADMIN!"
} catch {
    Write-Host "Failed: $_"
}
