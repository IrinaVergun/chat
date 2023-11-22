import { WebSocketServer } from "ws"; //вытаскиваю значение сервера в переменную
import { v4 as uuid } from "uuid"; // библиотека для айди
import { writeFile, readFileSync, existsSync } from "fs";
const clients = {}; // скадываю клиентов  в объект чтобы они удобно лежали
const log = existsSync("log") && readFileSync("log");
const wss = new WebSocketServer({ port: process.env.PORT || 3000 }); // на каком порту будет работать сервер
const messages = JSON.parse(log) || []; // то куда я складываю все сообщения

wss.on("connection", (ws) => {
  //подключение клиента к сервуру,на каждое соединение получаем экземпяр соединения и буду с ним работать
  const id = uuid(); //у меня произошло подлючение складываю его в список клиентов
  clients[id] = ws; // ws,  который соединился с клиентом
  console.log(`New clients ${id}`); // новый клиент
  ws.send(JSON.stringify(messages));
  ws.on("message", (rawMessage) => {
    console.log(rawMessage.toString()); //слушаем сообщения от клиента , привожу к тустринг чтобы было читабельно
    const { name, message } = JSON.parse(rawMessage.toString()); // теперь есть эти значение на сервере
    messages.push({ name, message }); // тут отправляю на сервер вс есообщения
    for (const id in clients) {
      clients[id].send(JSON.stringify([{ name, message }])); // отправим назад те сообщения с сервера приводим к строке
    }
  }); // если прошло сообщение клиента , то мы с ним чтото делаем
  ws.on("close", () => {
    delete clients[id]; //если клиент вышел , то увижу клиент заккрылся
    console.log(`client is closed ${id}`);
  });
});

process.on("SIGINT", () => {
  wss.close();
  writeFile("log", JSON.stringify(messages), (err) => {
    if (err) {
      console.log(err);
    }
    process.exit();
  });
}); // обробатываем сигнал есои приложение прирваое в работе
