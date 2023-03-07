const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");
resolve = require("path").resolve;
const _ = require("lodash");
let users = require("./files/users.json");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
// console.log(users);
let chat_context = users.context;
let chat_limit = users.limits;
let user_info = users.infos;

// console.log(_.takeRight(chat_context["1603505052"], 2));
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!chat_context[msg.from.id]) {
    chat_context[msg.from.id] = [
      {
        role: "system",
        content: `usre name is ${msg.from.username}, All the response need to be less that 30 words`,
      },
    ];
    user_info[msg.from.id] = msg.from;

    chat_limit[msg.from.id] = {
      date: new Date().toDateString(),
      token_usage: 0,
      limit: 200,
    };
  } else if (
    chat_limit[msg.from.id] &&
    chat_limit[msg.from.id].date === new Date().toDateString() &&
    chat_limit[msg.from.id].token_usage >= chat_limit[msg.from.id].limit
  ) {
    bot.sendMessage(
      chatId,
      `Sorry ${msg.from.username} limit of ${
        chat_limit[msg.from.id].limit
      } tokens reach  for today`
    );

    return;
  }

  chat_context[msg.from.id].push({ role: "user", content: msg.text });

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    max_tokens: 100,
    messages: _.takeRight(chat_context[msg.from.id], 2),
  });

  //   console.log(completion.data.choices[0].message.content);
  chat_context[msg.from.id].push({
    role: "assistant",
    content: completion.data.choices[0].message.content,
  });

  chat_limit[msg.from.id].token_usage =
    chat_limit[msg.from.id].token_usage + completion.data.usage.total_tokens;
  console.log(chat_limit[msg.from.id].token_usage);
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, completion.data.choices[0].message.content);

  fs.writeFileSync(
    path.resolve(resolve("./files/"), "users.json"),
    JSON.stringify({
      context: chat_context,
      limits: chat_limit,
      infos: user_info,
    })
  );
});
