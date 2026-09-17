// --- CONFIGURAÇÕES DO BROKER E TÓPICO ---
const brokerUrl = 'ws://172.16.1.71:9001'; // Mosquitto local via WebSocket
const topicoComando = 'led/control';       // Tópico de controle (entrada)
const topicoStatus = 'led/status';         // Tópico de status (saída)

let client;

// Conectar ao Broker MQTT
function conectar() {
    adicionarLog(`Conectando em ${brokerUrl}...`);

    // Cria um ID de cliente único para evitar conflitos de conexão
    const clientId = 'web_client_' + Math.random().toString(16).substr(2, 8);

    client = mqtt.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 4000
    });

    // Evento: Conectado com sucesso
    client.on('connect', () => {
        adicionarLog('Conectado ao Broker!');
        atualizarStatusUI(true);

        // Assina o tópico de status do LED
        client.subscribe(topicoStatus, (err) => {
            if (!err) {
                adicionarLog(`Assinado em ${topicoStatus}`);
            } else {
                adicionarLog(`Erro ao assinar: ${err}`);
            }
        });
    });

    // Evento: Mensagem recebida
    client.on('message', (topic, message) => {
        if (topic === topicoStatus) {
            const estado = message.toString();
            adicionarLog(`Status recebido: ${estado}`);
            document.getElementById('status').innerText = estado;
        }
    });

    // Evento: Erro na conexão
    client.on('error', (err) => {
        adicionarLog('Erro: ' + err.message);
        client.end();
    });

    // Evento: Conexão perdida
    client.on('offline', () => {
        adicionarLog('Conexão perdida. Tentando reconectar...');
        atualizarStatusUI(false);
        setTimeout(conectar, 5000); // tenta reconectar após 5s
    });
}

// Função para publicar o comando MQTT
function enviarComando(comando) {
    if (client && client.connected) {
        client.publish(topicoComando, comando, { qos: 0, retain: false }, (error) => {
            if (error) {
                adicionarLog(`Erro ao enviar: ${error}`);
            } else {
                adicionarLog(`Enviado: [${comando}] -> ${topicoComando}`);
            }
        });
    } else {
        adicionarLog('Não é possível enviar: Cliente off-line.');
    }
}

// Atualiza a interface (Botões e Status)
function atualizarStatusUI(conectado) {
    const statusEl = document.getElementById('status');
    const btnLigar = document.getElementById('btnLigar');
    const btnDesligar = document.getElementById('btnDesligar');

    if (conectado) {
        statusEl.innerText = "Conectado";
        statusEl.className = "status conectado";
        btnLigar.disabled = false;
        btnDesligar.disabled = false;
    } else {
        statusEl.innerText = "Desconectado";
        statusEl.className = "status desconectado";
        btnLigar.disabled = true;
        btnDesligar.disabled = true;
    }
}

// Função utilitária para exibir logs na tela
function adicionarLog(mensagem) {
    const logDiv = document.getElementById('log');
    const hora = new Date().toLocaleTimeString();
    logDiv.innerHTML += `[${hora}] ${mensagem}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight; // Rola a barra até o final
}

// Inicia a conexão assim que a página é carregada
window.onload = conectar;