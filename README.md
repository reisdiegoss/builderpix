BuilderPIX - Gerador de QR Code e Payload PIX<p align="center"><!-- Badges --><a href="https://github.com/reisdiegoss/builderpix"><img src="https://www.google.com/search?q=https://img.shields.io/github/stars/reisdiegoss/builderpix%3Fstyle%3Dfor-the-badge%26logo%3Dgithub%26label%3DStars" alt="GitHub Stars"></a><a href="https://www.google.com/search?q=https://hub.docker.com/r/builderapi/builderpix"><img src="https://www.google.com/search?q=https://img.shields.io/docker/pulls/builderapi/builderpix%3Fstyle%3Dfor-the-badge%26logo%3Ddocker%26label%3DPulls" alt="Docker Pulls"></a><a href="https://www.google.com/search?q=https://github.com/reisdiegoss/builderpix/blob/main/LICENSE"><img src="https://www.google.com/search?q=https://img.shields.io/github/license/reisdiegoss/builderpix%3Fstyle%3Dfor-the-badge%26label%3DLicen%25C3%25A7a" alt="Licen�a"></a><a href="https://builderpix.dominio.com.br"><img src="https://www.google.com/search?q=https://img.shields.io/badge/Site-Acessar-blue%3Fstyle%3Dfor-the-badge%26logo%3Dgoogle-chrome%26logoColor%3Dwhite" alt="Acessar o Site"></a></p>BuilderPIX � uma aplica��o Node.js completa que oferece uma interface web e uma API RESTful para gerar dinamicamente QR Codes e payloads "Copia e Cola" para transa��es PIX, seguindo as especifica��es do Banco Central do Brasil.? FuncionalidadesInterface Web Intuitiva: Um frontend simples para preencher os dados e gerar o PIX visualmente.API RESTful Robusta: Um endpoint /api/generate para integra��es, permitindo que outros sistemas gerem c�digos PIX.Gera��o de QR Code: Retorna a imagem do QR Code em formato Base64.Payload "Copia e Cola": Retorna o payload (BR Code) completo para transa��es.Sem Depend�ncias Externas: A l�gica de gera��o do PIX � totalmente contida na aplica��o.Pronto para Orquestra��o: Inclui exemplos para rodar com Docker Swarm e Traefik como proxy reverso.?? Como Usar1. Pr�-requisitosNode.js (v18 ou superior)Docker (para rodar em cont�iner)2. Rodando Localmente (Para Desenvolvimento)Primeiro, clone o reposit�rio:git clone [https://github.com/reisdiegoss/builderpix.git](https://github.com/reisdiegoss/builderpix.git)
cd builderpix
Instale as depend�ncias:npm install
Inicie o servidor de desenvolvimento:npm start
A aplica��o estar� dispon�vel em http://localhost:3000.3. Executando com DockerPara rodar a aplica��o de forma simples usando a imagem do Docker Hub:docker run -d -p 3000:3000 --name builderpix builderapi/builderpix:latest
Ap�s executar o comando, acesse http://localhost:3000 no seu navegador.4. Executando com Docker Swarm e TraefikEsta � a forma recomendada para ambientes de produ��o, utilizando o Traefik como proxy reverso para gerenciar o tr�fego e os certificados SSL.Crie um arquivo docker-stack.yml com o conte�do abaixo:version: "3.8"

services:
  builderpix:
    image: builderapi/builderpix:latest
    hostname: builderpix
    networks:
      - network_public
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '0.5'
          memory: 1024M
      labels:
        # --- Configura��es do Traefik ---
        - "traefik.enable=true"
        - "traefik.docker.network=network_public"
        # Roteador HTTP para o dom�nio
        - "traefik.http.routers.builderpix.rule=Host(`builderpix.dominio.com.br`)"
        - "traefik.http.routers.builderpix.entrypoints=websecure"
        - "traefik.http.routers.builderpix.service=builderpix-svc"
        # Configura��es de TLS/SSL com Let's Encrypt
        - "traefik.http.routers.builderpix.tls=true"
        - "traefik.http.routers.builderpix.tls.certresolver=letsencryptresolver"
        # Defini��o do servi�o e porta da aplica��o
        - "traefik.http.services.builderpix-svc.loadbalancer.server.port=3000"

networks:
  network_public:
    external: true
Pr�-requisitos para o Swarm:Voc� precisa ter uma inst�ncia do Traefik rodando e conectada � rede network_public.A rede network_public deve ser do tipo overlay e ter sido criada previamente.Altere builderpix.dominio.com.br para o seu dom�nio real.Para implantar a stack, execute:docker stack deploy -c docker-stack.yml builderpix
Ap�s a implanta��o, acesse https://builderpix.dominio.com.br no seu navegador.?? API EndpointA aplica��o exp�e um endpoint principal para a gera��o do PIX.POST /api/generateGera o BR Code e o QR Code em Base64.Exemplo de requisi��o com curl:curl -X POST [https://builderpix.dominio.com.br/api/generate](https://builderpix.dominio.com.br/api/generate) \
-H "Content-Type: application/json" \
-d '{
  "pixKey": "seu-email@provedor.com",
  "beneficiaryName": "NOME COMPLETO DO BENEFICIARIO",
  "beneficiaryCity": "SAO PAULO",
  "amount": 19.99,
  "txid": "PEDIDO12345"
}'
Exemplo de resposta (Sucesso 200 OK):{
  "brcode": "00020126580014BR.GOV.BCB.PIX...",
  "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAA..."
}
??? DockerfileA imagem � constru�da utilizando um processo multi-stage para otimiza��o, resultando em uma imagem final leve e segura.# Etapa 1: Base da Constru��o
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .

# Etapa 2: Imagem Final de Produ��o
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .
EXPOSE 3000
USER node
CMD [ "node", "server.js" ]
?? ContribuindoContribui��es s�o bem-vindas! Sinta-se � vontade para abrir uma issue ou enviar um pull request.?? Licen�aEste projeto est� sob a licen�a MIT. Veja o arquivo LICENSE para mais detalhes.