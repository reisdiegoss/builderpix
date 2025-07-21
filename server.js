// --- Arquivo: server.js ---

// ADICIONADO: Polyfill para garantir compatibilidade com versões antigas do Node.js
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const qrcode = require('qrcode'); // Importa a biblioteca para gerar QR Code

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// --- Funções de Lógica do PIX ---
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, '')
        .trim();
};

const formatField = (id, value) => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
};

const crc16 = (payload) => {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};


// --- Rota da API ---

app.post('/api/generate', async (req, res) => { // A função agora é assíncrona
    try {
        const { pixKey, beneficiaryName, beneficiaryCity, amount, txid: userTxid } = req.body;

        if (!pixKey || !beneficiaryName || !beneficiaryCity) {
            return res.status(400).json({ error: 'Os campos pixKey, beneficiaryName e beneficiaryCity são obrigatórios.' });
        }

        const cleanPixKey = pixKey.replace(/\s/g, '');
        const normalizedName = normalizeText(beneficiaryName).substring(0, 25);
        const normalizedCity = normalizeText(beneficiaryCity).substring(0, 15);
        
        let txid = userTxid && userTxid.trim() !== '' ? userTxid.replace(/\s/g, '') : '***';
        txid = txid.substring(0, 25);
        
        const formattedAmount = amount ? parseFloat(amount).toFixed(2) : null;

        const gui = formatField('00', 'BR.GOV.BCB.PIX');
        const keyField = formatField('01', cleanPixKey);
        const merchantAccountInfo = formatField('26', gui + keyField);
        const merchantCategoryCode = '52040000';
        const transactionCurrency = '5303986';
        const amountField = formattedAmount ? formatField('54', formattedAmount) : '';
        const countryCode = '5802BR';
        const beneficiaryNameField = formatField('59', normalizedName);
        const beneficiaryCityField = formatField('60', normalizedCity);
        const txidField = formatField('05', txid);
        const additionalDataField = formatField('62', txidField);

        let payload = '000201' +
                      merchantAccountInfo +
                      merchantCategoryCode +
                      transactionCurrency +
                      amountField +
                      countryCode +
                      beneficiaryNameField +
                      beneficiaryCityField +
                      additionalDataField +
                      '6304';

        const finalPayload = payload + crc16(payload);
        
        // Gera a imagem do QR Code em Base64 com o novo tamanho
        const qrCodeBase64 = await qrcode.toDataURL(finalPayload, { width: 360 });

        // Retorna ambos os dados
        res.status(200).json({ 
            brcode: finalPayload,
            qrCodeBase64: qrCodeBase64
        });

    } catch (error) {
        console.error('Erro ao gerar o código PIX:', error);
        res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
});

// Rota raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- PONTO CRÍTICO ---
// O bloco de código abaixo é ESSENCIAL para manter o servidor rodando.
// Se o servidor estiver parando sozinho, é provável que este trecho esteja faltando no seu arquivo.
app.listen(port, () => {
    console.log(`Servidor rodando. Acesse http://localhost:${port} para ver a aplicação.`);
});