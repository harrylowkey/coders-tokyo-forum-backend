FROM node:10.16.0

ENV HOME=/home/node

WORKDIR $HOME/app

COPY package.json package-lock.json ${HOME}/app/

RUN npm install

COPY . $HOME/app

EXPOSE 3000

CMD ["npm", "start"]
