$BASE_URL = "http://localhost:8080"

# -------------------------------------------------------
# PASSO 0 - Login
# -------------------------------------------------------
Write-Host ""
Write-Host "PASSO 0 - Autenticando..."

$loginResp = Invoke-WebRequest -Uri "$BASE_URL/funcionarios/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"id": 1, "senha": "123456"}' -UseBasicParsing

$token = ($loginResp.Content | ConvertFrom-Json).token
Write-Host ("Token obtido: " + $token.Substring(0, 30) + "...")

# -------------------------------------------------------
# TESTE 1 - 5 agendamentos paralelos com Runspaces
# -------------------------------------------------------
Write-Host ""
Write-Host "======================================================"
Write-Host "TESTE 1 - 5 agendamentos paralelos simultaneos"
Write-Host "======================================================"

$runspacePool = [runspacefactory]::CreateRunspacePool(1, 10)
$runspacePool.Open()

$runspaces = @()
for ($i = 1; $i -le 5; $i++) {
    # JSON completo com cpf unico por request
    $cpf = "0000000010" + $i
    $body = '{"prioridade":"S","paciente":{"nome":"Paciente ' + $i + '","cpf":"' + $cpf + '","genero":"M","telefone":"61900000000","possuiConvenio":false}}'

    $ps = [powershell]::Create()
    $ps.RunspacePool = $runspacePool

    [void]$ps.AddScript({
        param($url, $b, $idx, $tok)
        try {
            $resp = Invoke-WebRequest -Uri ($url + "/consultas/agendar") `
                -Method POST -ContentType "application/json" `
                -Headers @{ Authorization = ("Bearer " + $tok) } `
                -Body $b -UseBasicParsing
            $json = $resp.Content | ConvertFrom-Json
            return ("[REQ " + $idx + "] HTTP " + $resp.StatusCode + " | Senha: " + $json.senha + " | Consultorio: " + $json.consultorio)
        } catch {
            return ("[REQ " + $idx + "] ERRO " + $_.Exception.Message)
        }
    }).AddArgument($BASE_URL).AddArgument($body).AddArgument($i).AddArgument($token)

    $runspaces += [PSCustomObject]@{ PS = $ps; Handle = $ps.BeginInvoke(); Index = $i }
}

foreach ($rs in $runspaces) {
    $result = $rs.PS.EndInvoke($rs.Handle)
    Write-Host $result
    $rs.PS.Dispose()
}
$runspacePool.Close()

# -------------------------------------------------------
# TESTE 2 - Conflito de concorrencia
# -------------------------------------------------------
Write-Host ""
Write-Host "======================================================"
Write-Host "TESTE 2 - Conflito de concorrencia (esperado: 204 + 409)"
Write-Host "======================================================"

$filaResp = Invoke-WebRequest -Uri "$BASE_URL/consultas/fila" `
  -Method GET -Headers @{ Authorization = ("Bearer " + $token) } -UseBasicParsing

$fila = $filaResp.Content | ConvertFrom-Json
if ($fila.Count -eq 0) {
    Write-Host "Fila vazia! O TESTE 1 falhou em criar consultas."
    exit
}

$consultaId = $fila[0].id
Write-Host ("Consultando ID=" + $consultaId + " | Senha=" + $fila[0].senha)
Write-Host "Disparando 2 requests simultaneos..."

$pool2 = [runspacefactory]::CreateRunspacePool(1, 5)
$pool2.Open()

$jobs2 = @()
foreach ($label in @("A", "B")) {
    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool2

    [void]$ps.AddScript({
        param($url, $id, $tok, $lbl)
        try {
            $resp = Invoke-WebRequest -Uri ($url + "/consultas/" + $id + "/concluir") `
                -Method PUT -ContentType "application/json" `
                -Headers @{ Authorization = ("Bearer " + $tok) } `
                -UseBasicParsing
            return ("[REQ " + $lbl + "] Status: " + $resp.StatusCode + " - SUCESSO (atendimento concluido)")
        } catch {
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -eq 409) {
                return ("[REQ " + $lbl + "] Status: 409 - CONFLITO DETECTADO (Optimistic Lock funcionou!)")
            }
            return ("[REQ " + $lbl + "] Status: " + $code)
        }
    }).AddArgument($BASE_URL).AddArgument($consultaId).AddArgument($token).AddArgument($label)

    $jobs2 += [PSCustomObject]@{ PS = $ps; Handle = $ps.BeginInvoke(); Label = $label }
}

foreach ($j in $jobs2) {
    $result = $j.PS.EndInvoke($j.Handle)
    Write-Host $result
    $j.PS.Dispose()
}
$pool2.Close()

Write-Host ""
Write-Host "======================================================"
Write-Host "RESULTADO ESPERADO:"
Write-Host "  TESTE 1: 5 linhas com senhas S-001 a S-005"
Write-Host "  TESTE 2: um SUCESSO + um CONFLITO DETECTADO"
Write-Host ""
Write-Host "Ver logs do worker:"
Write-Host "  docker-compose logs backend | Select-String WORKER,SERVICE,CONFLITO"
Write-Host "======================================================"