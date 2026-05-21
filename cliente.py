import requests
import os
import socket
import time
import random

BASE_URL = os.getenv("BACKEND_URL", "http://backend:8080")
IP_PROPRIO = socket.gethostbyname(socket.gethostname())
VU_ID = os.getenv("VU_ID", IP_PROPRIO)

def log(msg):
    print(f"[IP={IP_PROPRIO} | VU={VU_ID}] {msg}", flush=True)

def login():
    res = requests.post(f"{BASE_URL}/funcionarios/login",
        json={"id": 1, "senha": "123456"})
    if res.status_code == 200:
        return res.json()["token"]
    raise Exception(f"Login falhou: {res.status_code}")

def agendar(token, idx):
    prioridades = ["S", "S", "S", "P", "U"]
    prio = random.choice(prioridades)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {
        "prioridade": prio,
        "paciente": {
            "nome": f"Paciente {VU_ID}",
            "cpf": f"{random.randint(10000000000, 99999999999)}",
            "genero": "M",
            "telefone": "61900000000",
            "possuiConvenio": False,
        }
    }
    inicio = time.time()
    res = requests.post(f"{BASE_URL}/consultas/agendar", json=body, headers=headers)
    tempo = (time.time() - inicio) * 1000

    if res.status_code == 200:
        senha = res.json().get("senha", "?")
        log(f"AGENDAMENTO OK | senha={senha} | prioridade={prio} | tempo={tempo:.0f}ms")
    else:
        log(f"AGENDAMENTO ERRO | status={res.status_code} | tempo={tempo:.0f}ms")

def tentar_concluir(token, consulta_id):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    inicio = time.time()
    res = requests.put(f"{BASE_URL}/consultas/{consulta_id}/concluir",
        headers=headers)
    tempo = (time.time() - inicio) * 1000

    if res.status_code == 204:
        log(f"CONCLUSAO OK | id={consulta_id} | HTTP 204 | tempo={tempo:.0f}ms")
    elif res.status_code == 409:
        log(f"CONFLITO DETECTADO | id={consulta_id} | HTTP 409 — Optimistic Lock funcionou! | tempo={tempo:.0f}ms")
    else:
        log(f"CONCLUSAO ERRO | id={consulta_id} | status={res.status_code} | tempo={tempo:.0f}ms")

def buscar_fila(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/consultas/fila", headers=headers)
    if res.status_code == 200:
        return res.json()
    return []

def main():
    log(f"Container iniciado. Aguardando backend...")
    time.sleep(random.uniform(1, 3))  # Stagger para simular chegada gradual

    try:
        token = login()
        log("Login OK — iniciando testes")
    except Exception as e:
        log(f"ERRO no login: {e}")
        return

    # TESTE 1 — Agendamento
    log("--- TESTE 1: Agendamento ---")
    agendar(token, 1)
    time.sleep(random.uniform(0.5, 1.5))

    # TESTE 2 — Tentar concluir (conflito)
    log("--- TESTE 2: Conflito de concorrência ---")
    fila = buscar_fila(token)

    if fila:
        consulta_id = fila[0]["id"]
        log(f"Tentando concluir consulta id={consulta_id} simultaneamente com outros containers")
        tentar_concluir(token, consulta_id)
    else:
        log("Fila vazia — pulando teste de conflito")

    log("Container finalizado.")

if __name__ == "__main__":
    main()
