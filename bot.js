const TelegramBot = require('node-telegram-bot-api');
const Twit = require('twit');

const BOT_TOKEN = 'YOUR_BOT_TOKEN'; // Replace with your bot token
const TELEGRAM_GROUP_CHAT_ID = 'YOUR_TELEGRAM_GROUP_CHAT_ID'; // Replace with your group chat ID
const TWITTER_API_KEYS = {
  consumer_key: 'YOUR_TWITTER_CONSUMER_KEY',
  consumer_secret: 'YOUR_TWITTER_CONSUMER_SECRET',
  access_token: 'YOUR_TWITTER_ACCESS_TOKEN',
  access_token_secret: 'YOUR_TWITTER_ACCESS_TOKEN_SECRET',
};

const bot = new TelegramBot(BOT_TOKEN);
const twitter = new Twit(TWITTER_API_KEYS);

let twitterHandle = '@Og_kingdev'; // Default Twitter handle

async function scrapeTwitter(twitterHandle) {
  try {
    const response = await twitter.get('statuses/user_timeline', {
      screen_name: twitterHandle,
      count: 1,
    });

    if (response.data.length === 0) {
      console.error(`No tweets found for ${twitterHandle}`);
      return null;
    }

    const tweetText = response.data[0].text;
    const smartContractAddress = tweetText.match(/(0x[a-fA-F0-9]{40}|https:\/\/dex.tools\/|https:\/\/dexscreener.com\/)/);

    if (!smartContractAddress) {
      console.error(`No smart contract or relevant link found in the tweet: ${tweetText}`);
      return null;
    }

    return {
      tweetText,
      smartContractAddress: smartContractAddress[0],
    };
  } catch (error) {
    console.error(`Failed to fetch Twitter data: ${error.message}`);
    return null;
  }
}

async function checkForNewSmartContracts() {
  const tweetData = await scrapeTwitter(twitterHandle);

  if (tweetData) {
    // Prepare inline keyboard with 10 buttons, each linking to a different URL
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
      buttons.push([
        {
          text: `Button ${i}`,
          url: `https://example.com/button${i}`,
        },
      ]);
    }

    // Construct the message with the smart contract address and inline keyboard
    const message = `New Smart contract detected on ${tweetData.smartContractAddress}\nCA: ${tweetData.smartContractAddress}\nX account: x.com/${twitterHandle}`;

    // Build the inline keyboard markup
    const keyboard = {
      inline_keyboard: buttons,
    };

    // Send the message with the inline keyboard to the Telegram group
    bot.sendMessage(TELEGRAM_GROUP_CHAT_ID, message, {
      reply_markup: keyboard,
    });
  }
}

setInterval(checkForNewSmartContracts, 60 * 1000);

// Telegram Bot Commands
bot.onText(/\/sethandle (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const newHandle = match[1];

  twitterHandle = newHandle;
  bot.sendMessage(chatId, `Twitter handle updated to ${newHandle}`);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `Welcome to the Twitter Contract Tracker Bot!\nCommands:\n/sethandle [new_handle] - Change the Twitter handle to track.\n/help - Display this help message.`;

  bot.sendMessage(chatId, helpMessage);
});
  
