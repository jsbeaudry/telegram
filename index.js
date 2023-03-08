const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
resolve = require("path").resolve;
const _ = require("lodash");
const ffmpeg = require("./ffmpeg");

const express = require("express");
const { json } = require("express");
const app = express();
app.use(express.static("public"));
app.use(json());
const PORT = process.env.PORT || 3001;

const {
  create,
  findById,
  remove,
  update,
  find,
} = require("./database/methods/user");
const { createMessage, findMessage } = require("./database/methods/message");

const { checkoutsession } = require("./subscription");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

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

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let data = msg.from;
  data.limit = {
    date: new Date().toDateString(),
    tokenUsage: 0,
    limit: 1000,
  };
  await create(data);
  bot.sendMessage(chatId, "Hello");
});

bot.onText(/\/pay/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const rep = await checkoutsession(20, userId);
  bot.sendMessage(chatId, rep.url);
});
// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  let userData = await find({ id: msg.from.id });

  userData = userData[0];
  // await findById("6408066cc7f4d4537d3d6c45");
  // await remove("6408066cc7f4d4537d3d6c45");
  // await update(1603505052, { first_name: "wqeeqeqw" });
  if (
    userData.limit.date === new Date().toDateString() &&
    userData.limit.tokenUsage >= userData.limit.limit
  ) {
    bot.sendMessage(
      chatId,
      `Sorry ${msg.from.username} limit of ${userData.limit.limit} tokens reach  for today \n/pay to get more \n/check to check limit usage \n/help ti get help \n/contact to signal something
        `
    );
    return;
  }

  if (msg && msg.chat && !msg.voice) {
    await createMessage({
      role: "user",
      content: msg.text,
      user: userData._id,
    });

    let messageList = await findMessage({ user: userData._id });
    messageList = messageList.map((m) => {
      return {
        role: m.role,
        content: m.content,
      };
    });
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 100,
      messages: _.concat(
        [
          {
            role: "system",
            content: `user name is ${userData.username}, All the response need to be less that 100 words`,
          },
        ],
        _.takeRight(messageList, 4)
      ),
    });

    await createMessage({
      role: "assistant",
      content: completion.data.choices[0].message.content,
      user: userData._id,
    });

    userData.limit.tokenUsage =
      userData.limit.tokenUsage + completion.data.usage.total_tokens;
    console.log(userData.limit.tokenUsage);

    await update(userData.id, { limit: userData.limit });

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, completion.data.choices[0].message.content);
  }
  if (msg && msg.voice) {
    const voiceId = msg.voice.file_id;

    // bot.sendVoice(chatId, "./files/guitar.mp3");
    const audio = await bot.getFileLink(voiceId);

    ffmpeg(audio)
      .toFormat("wav")
      .on("progress", async (progress) => {
        console.log("Processing: " + progress.targetSize + " KB converted");

        const resp = await openai.createTranscription(
          fs.createReadStream("./current.wav"),
          "whisper-1"
        );

        const { status, statusText, data } = resp;
        console.log(status, statusText, data);

        await createMessage({
          role: "user",
          content: data.text,
          user: userData._id,
        });

        let messageList = await findMessage({ user: userData._id });
        messageList = messageList.map((m) => {
          return {
            role: m.role,
            content: m.content,
          };
        });

        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          max_tokens: 100,
          messages: _.concat(
            [
              {
                role: "system",
                content: `user name is ${userData.username}, All the response need to be less that 100 words`,
              },
            ],
            _.takeRight(messageList, 4)
          ),
        });

        await createMessage({
          role: "assistant",
          content: completion.data.choices[0].message.content,
          user: userData._id,
        });

        userData.limit.tokenUsage =
          userData.limit.tokenUsage + completion.data.usage.total_tokens;
        console.log(userData.limit.tokenUsage);

        await update(userData.id, { limit: userData.limit });

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, completion.data.choices[0].message.content);

        // bot.sendMessage(chatId, `${data.text}`);
      })
      .on("error", (err) => {
        console.log("An error occurred: " + err.message);
      })
      .on("end", () => {
        console.log("Processing finished !");
      })
      .save("./current.wav"); //path where you want to save your file
  }
});

app.get("/", (req, res) => {
  return res.json({ test: "on" });
});

app.listen(PORT, () => console.log(`Server is up and running on ${PORT}`));

// git push https://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@github.com//jsbeaudry/telegram.git/
