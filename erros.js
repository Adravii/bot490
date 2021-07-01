
          if (!args)
            return message.reply(
              "Tienes que especifi (e.g, SET_PARENT, SMSG, or CREATE). Error codes are case sensitive."
            );
          switch (args[0]) {
            case "SET_PARENT": {
              message.reply(
                "`SET_PARENT` occurs when the bot couldn't set the category for a channel. Make sure it has Manage Channel and Manage Message. If this still persists you may need to give it Administrator as a work around."
              );
              break;
            }
            case "SMSG": {
              message.reply(
                "`SMSG` occurs when the bot couldn't send a message to a user or to a channel. This will happen if the bot either doesn't have Send Messages permissions or the user doesn't allow direct messages from the server. The ending number for this error is the user ID it was messaging for. This ID will be in the channels topic."
              );
              break;
            }
            case "CREATE": {
              message.reply(
                "`CREATE` occurs when the bot couldn't create a channel. Usually from the bot lacking Manage Channels permissions, similar to `SET_PARENT`."
              );
              break;
            }
            case "SHOOK": {
              message.reply(
                "`SHOOK` occurs when the bot couldn't send a message through a webhook (when method 0 is set). The bot shouldn't _need_ permissions to use a hook. The ending number for this error is the user ID it was messaging for. This ID will be in the channels topic. You can either check that the integrations for the server has the webhook, or delete the channel."
              );
              break;
            }
            case "CHOOK": {
              message.reply(
                "`CHOOK` occurs when the bot couldn't create a webhook (when method 0 is set). Make sure the bot has Manage Webhook permissions and that the bot can create and see channels within the category that channels go to. The ending number for this error is the user ID it was messaging for. This ID will be in the channels topic."
              );
              break;
            }
            default: {
              message.reply(
                "you must give me a command code (e.g, SET_PARENT, SMSG, or CREATE). Error codes are case sensitive."
              );
            }
          }
          break;