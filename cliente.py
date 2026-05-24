#!/usr/bin/env python3
"""
cliente.py — container cliente independente
Logs salvos em /logs/execucoes.log com timestamp por sessão.
O arquivo acumula todas as execuções sem sobrescrever.
"""

import requests
import os
import socket
import time
import random
import threading
from datetime import datetime

BASE_URL   = os.getenv("BACKEND_URL", "http://backend:8080")
MODO       = os.getenv("MODO", "continuo")
CICLOS     = int(os.getenv("CICLOS", "999999"))
INTERVALO  = float(os.getenv("INTERVALO", "2"))

IP_PROPRIO = socket.gethostbyname(socket.gethostname())
HOSTNAME   = socket.gethostname()
SESSAO_ID  = datetime.now().strftime("%Y%m%d_%H%M%S") + f"_{HOSTNAME}"

LOG_DIR    = "/logs"
LOG_FILE   = f"{LOG_DIR}/execucoes.log"

os.makedirs(LOG_DIR, exist_ok=True)

# ── Logger ─────────────────────────────────────────────────────────────────
def log(msg, nivel="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    linha = f"[{ts}] [{nivel:<8}] [SESSAO={SESSAO_ID}] [IP={IP_PROPRIO}] {msg}"
    print(linha, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(linha + "\n")
    except Exception:
        pass

def log_separador(titulo=""):
    linha = "=" * 70
    if titulo:
        linha = f"{'=' * 10} {titulo} {'=' * (58 - len(titulo))}"
    log(linha)

# ── Métricas ───────────────────────────────────────────────────────────────
metricas = {"total": 0, "sucesso": 0, "erro": 0, "conflito": 0, "tempos": []}
lock = threading.Lock()

def registrar(tempo_ms, ok=True, conflito=False):
    with lock:
        metricas["total"] += 1
        metricas["tempos"].append(tempo_ms)
        if conflito:   metricas["conflito"] += 1
        elif ok:       metricas["sucesso"] += 1
        else:          metricas["erro"] += 1

# ── Auth ───────────────────────────────────────────────────────────────────
def login():
    for tentativa in range(5):
        try:
            res = requests.post(f"{BASE_URL}/funcionarios/login",
                json={"id": 1, "senha": "123456"}, timeout=10)
            if res.status_code == 200:
                return res.json()["token"]
        except Exception as e:
            log(f"Login tentativa {tentativa+1} falhou: {e}", "WARN")
            time.sleep(2)
    raise Exception("Login falhou após 5 tentativas")

# ── Operações ──────────────────────────────────────────────────────────────
def agendar(headers):
    prio = random.choices(["S", "P", "U"], weights=[70, 20, 10])[0]
    cpf  = f"{random.randint(10000000000, 99999999999)}"
    body = {
        "prioridade": prio,
        "paciente": {
            "nome": f"Paciente {HOSTNAME}",
            "cpf": cpf,
            "genero": random.choice(["M", "F"]),
            "telefone": "61900000000",
            "possuiConvenio": False,
        }
    }
    inicio = time.time()
    res = requests.post(f"{BASE_URL}/consultas/agendar",
        json=body, headers=headers, timeout=10)
    tempo = (time.time() - inicio) * 1000

    if res.status_code == 200:
        senha = res.json().get("senha", "?")
        log(f"AGENDAR OK    | senha={senha} | prio={prio} | {tempo:.0f}ms")
        registrar(tempo, ok=True)
        return res.json().get("id")
    else:
        log(f"AGENDAR ERRO  | status={res.status_code} | {tempo:.0f}ms", "ERRO")
        registrar(tempo, ok=False)
        return None

def buscar_fila(headers):
    inicio = time.time()
    res = requests.get(f"{BASE_URL}/consultas/fila", headers=headers, timeout=10)
    tempo = (time.time() - inicio) * 1000
    qtd = len(res.json()) if res.status_code == 200 else 0
    log(f"BUSCAR FILA   | {qtd} na fila | {tempo:.0f}ms")
    registrar(tempo, ok=res.status_code == 200)
    return res.json() if res.status_code == 200 else []

def chamar_proximo(headers, consultorio):
    inicio = time.time()
    res = requests.post(f"{BASE_URL}/consultas/chamar/{consultorio}",
        headers=headers, timeout=10)
    tempo = (time.time() - inicio) * 1000
    if res.status_code == 200:
        senha = res.json().get("senha", "?")
        log(f"CHAMAR OK     | senha={senha} | consultório={consultorio} | {tempo:.0f}ms")
        registrar(tempo, ok=True)
        return res.json().get("id")
    elif res.status_code == 204:
        log(f"CHAMAR        | fila vazia | {tempo:.0f}ms", "WARN")
        registrar(tempo, ok=True)
    else:
        log(f"CHAMAR ERRO   | status={res.status_code} | {tempo:.0f}ms", "ERRO")
        registrar(tempo, ok=False)
    return None

def concluir(headers, consulta_id):
    inicio = time.time()
    res = requests.put(f"{BASE_URL}/consultas/{consulta_id}/concluir",
        headers=headers, timeout=10)
    tempo = (time.time() - inicio) * 1000
    if res.status_code == 204:
        log(f"CONCLUIR OK   | id={consulta_id} | HTTP 204 | {tempo:.0f}ms")
        registrar(tempo, ok=True)
    elif res.status_code == 409:
        log(f"CONFLITO 409  | id={consulta_id} | Optimistic Lock! | {tempo:.0f}ms", "CONFLITO")
        registrar(tempo, conflito=True)
    else:
        log(f"CONCLUIR ERRO | id={consulta_id} | status={res.status_code} | {tempo:.0f}ms", "ERRO")
        registrar(tempo, ok=False)

def imprimir_resumo():
    with lock:
        total    = metricas["total"]
        sucesso  = metricas["sucesso"]
        erro     = metricas["erro"]
        conflito = metricas["conflito"]
        tempos   = metricas["tempos"][:]
    if not tempos:
        return
    media = sum(tempos) / len(tempos)
    p95   = sorted(tempos)[int(len(tempos) * 0.95)]
    log_separador("RESUMO DA SESSAO")
    log(f"Sessão        : {SESSAO_ID}")
    log(f"Total req     : {total}")
    log(f"Sucesso       : {sucesso}")
    log(f"Erro          : {erro}")
    log(f"Conflito(409) : {conflito}")
    log(f"Tempo médio   : {media:.0f}ms")
    log(f"Tempo mínimo  : {min(tempos):.0f}ms")
    log(f"Tempo máximo  : {max(tempos):.0f}ms")
    log(f"Tempo p95     : {p95:.0f}ms")
    log_separador()

# ── Modos ──────────────────────────────────────────────────────────────────
def modo_continuo(headers):
    log(f"MODO CONTINUO | {CICLOS} ciclos | intervalo={INTERVALO}s")
    consultorio = random.choice(["01", "02", "03", "04", "05"])

    for ciclo in range(1, CICLOS + 1):
        log(f"--- Ciclo {ciclo}/{CICLOS} ---")
        try:
            agendar(headers)
            time.sleep(random.uniform(0.2, 0.5))
            buscar_fila(headers)
            time.sleep(random.uniform(0.1, 0.3))
            consulta_id = chamar_proximo(headers, consultorio)
            time.sleep(random.uniform(0.1, 0.3))
            if consulta_id:
                concluir(headers, consulta_id)
        except requests.exceptions.Timeout:
            log("Timeout", "WARN")
        except Exception as e:
            log(f"Erro no ciclo: {e}", "ERRO")
        time.sleep(random.uniform(INTERVALO * 0.5, INTERVALO * 1.5))

    imprimir_resumo()

def modo_benchmark(headers):
    log("MODO BENCHMARK | 10 requisições por endpoint")
    REPETICOES = 10
    resultados = {}

    for label, fn in [
        ("login", lambda: requests.post(f"{BASE_URL}/funcionarios/login",
            json={"id": 1, "senha": "123456"}, timeout=10)),
        ("buscar_fila", lambda: requests.get(f"{BASE_URL}/consultas/fila",
            headers=headers, timeout=10)),
        ("agendamento", lambda: requests.post(f"{BASE_URL}/consultas/agendar",
            json={"prioridade": "S", "paciente": {
                "nome": "Bench", "cpf": f"{random.randint(10000000000,99999999999)}",
                "genero": "M", "telefone": "61900000000", "possuiConvenio": False}},
            headers=headers, timeout=10)),
        ("chamar_proximo", lambda: requests.post(
            f"{BASE_URL}/consultas/chamar/{random.choice(['01','02','03','04','05'])}",
            headers=headers, timeout=10)),
    ]:
        tempos = []
        for _ in range(REPETICOES):
            inicio = time.time()
            fn()
            tempos.append((time.time() - inicio) * 1000)
        resultados[label] = tempos

    log_separador("BENCHMARK")
    log(f"{'Endpoint':<20} | {'avg':>6} | {'min':>6} | {'max':>6} | {'p95':>6}")
    log("-" * 60)
    for endpoint, tempos in resultados.items():
        media = sum(tempos) / len(tempos)
        p95   = sorted(tempos)[int(len(tempos) * 0.95)]
        log(f"{endpoint:<20} | {media:>5.0f}ms | {min(tempos):>5.0f}ms | {max(tempos):>5.0f}ms | {p95:>5.0f}ms")
    log_separador()

# ── Main ───────────────────────────────────────────────────────────────────
def main():
    log_separador(f"NOVA EXECUCAO — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"Modo={MODO} | Ciclos={CICLOS} | Backend={BASE_URL}")
    time.sleep(random.uniform(2, 5))

    try:
        token = login()
        log("Login OK")
    except Exception as e:
        log(f"FATAL: {e}", "ERRO")
        return

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    if MODO == "benchmark":
        modo_benchmark(headers)
    else:
        modo_continuo(headers)

if __name__ == "__main__":
    main()