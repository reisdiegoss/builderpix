# Etapa 1: Base da Construção
# Use uma imagem base oficial do Node.js. A versão 'alpine' é leve e segura, ideal para produção.
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de manifesto do pacote.
# O uso do wildcard (*) garante que tanto o package.json quanto o package-lock.json sejam copiados.
COPY package*.json ./

# Instala as dependências de produção. O '--only=production' ignora pacotes de desenvolvimento.
RUN npm install --only=production

# Copia o restante do código da aplicação para o diretório de trabalho
COPY . .

# Etapa 2: Imagem Final de Produção
# Começa uma nova imagem a partir de uma base limpa para um resultado final menor e mais seguro.
FROM node:18-alpine

WORKDIR /usr/src/app

# Copia as dependências instaladas e o código da aplicação da etapa de construção
COPY --from=builder /usr/src/app .

# Expõe a porta em que a aplicação roda dentro do contêiner
EXPOSE 3000

# Define o usuário para rodar a aplicação (melhor prática de segurança)
USER node

# Define o comando para iniciar a aplicação quando o contêiner for executado
CMD [ "node", "server.js" ]
