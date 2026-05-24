# rodar-testes.ps1
# Sobe N containers cliente em paralelo (background) com IPs proprios.
# Logs de todas as execucoes sao acumulados em .\logs\execucoes.log
#
# Uso:
#   .\rodar-testes.ps1              -> 20 containers, modo continuo
#   .\rodar-testes.ps1 -N 10        -> 10 containers
#   .\rodar-testes.ps1 -N 5 -Modo benchmark
#   .\rodar-testes.ps1 -N 20 -Ciclos 50

param(
    [int]$N      = 20,
    [string]$Modo   = "continuo",
    [int]$Ciclos    = 10,
    [float]$Intervalo = 1
)

# Pasta de logs na raiz do projeto (persiste entre execucoes)
$LogDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}
$LogFile = Join-Path $LogDir "execucoes.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $linha = "[$ts] [HOST] $msg"
    Write-Host $linha
    Add-Content -Path $LogFile -Value $linha -Encoding UTF8
}

Write-Host ""
Write-Host "======================================================"
Write-Host " Sistema Hospitalar - Teste com Containers Docker"
Write-Host " Containers : $N"
Write-Host " Modo       : $Modo"
Write-Host " Ciclos     : $Ciclos"
Write-Host " Log        : $LogFile"
Write-Host "======================================================"
Write-Host ""

Write-Log "========== NOVA RODADA | N=$N | Modo=$Modo | Ciclos=$Ciclos =========="

# Verifica se o backend esta rodando
$backend = docker ps --filter "name=hospital-backend" --format "{{.Names}}" 2>$null
if (-not $backend) {
    Write-Log "Backend nao encontrado. Subindo o sistema..."
    docker-compose up -d
    Write-Log "Aguardando 15s para inicializar..."
    Start-Sleep -Seconds 15
}

# Caminho absoluto da pasta de logs para montar como volume
$LogDirAbs = (Resolve-Path $LogDir).Path

Write-Host "[*] Subindo $N containers em background..."
Write-Host "[*] Logs sendo salvos em: $LogFile"
Write-Host ""

$jobs = @()
for ($i = 1; $i -le $N; $i++) {
    $nome = "hospital-cliente-$i"

    # Remove container anterior com mesmo nome se existir
    docker rm -f $nome 2>$null | Out-Null

    # Sobe container em background com Start-Job (equivalente ao & no bash)
    $job = Start-Job -ScriptBlock {
        param($nome, $modo, $ciclos, $intervalo, $logDirAbs)

        $output = docker run --rm `
            --name $nome `
            --network "hospital-management-system_default" `
            --env BACKEND_URL=http://hospital-backend:8080 `
            --env MODO=$modo `
            --env CICLOS=$ciclos `
            --env INTERVALO=$intervalo `
            --volume "${logDirAbs}:/logs" `
            hospital-management-system-cliente 2>&1

        Write-Output $output
    } -ArgumentList $nome, $Modo, $Ciclos, $Intervalo, $LogDirAbs

    $jobs += [PSCustomObject]@{ Job = $job; Nome = "hospital-cliente-$i" }
    Write-Log "Container hospital-cliente-$i iniciado em background (Job=$($job.Id))"
}

Write-Host ""
Write-Host "======================================================"
Write-Host " $N containers rodando em background"
Write-Host ""
Write-Host " Ver IPs em tempo real (outro terminal):"
Write-Host " docker ps --filter name=hospital-cliente"
Write-Host " docker inspect `$(docker ps -q --filter name=hospital-cliente) --format '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'"
Write-Host ""
Write-Host " Acompanhar logs ao vivo:"
Write-Host " Get-Content $LogFile -Wait"
Write-Host "======================================================"
Write-Host ""

# Aguarda todos os jobs terminarem e exibe output
foreach ($item in $jobs) {
    $result = $item.Job | Wait-Job | Receive-Job
    $result | ForEach-Object { Write-Host $_ }
    $item.Job | Remove-Job
    Write-Log "Container $($item.Nome) finalizado"
}

Write-Host ""
Write-Host "======================================================"
Write-Log "Todos os $N containers finalizaram."
Write-Host ""
Write-Host " Log completo disponivel em:"
Write-Host " $LogFile"
Write-Host "======================================================"