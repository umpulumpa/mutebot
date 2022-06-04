var path = require("path");
const currentPath = path.resolve(__dirname)
require('dotenv').config({path: currentPath+ "\\.env"});
const fs = require('fs')
const {
    Client,
    Intents,
    BaseGuildVoiceChannel,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    ButtonInteraction,
    MessageComponentInteraction,
    Permissions
} = require('discord.js');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

process.on('uncaughtException', (error, origin) => {
    console.log('----- Uncaught exception -----')
    console.log(error)
    console.log('----- Exception origin -----')
    console.log(origin)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('----- Unhandled Rejection at -----')
    console.log(promise)
    console.log('----- Reason -----')
    console.log(reason)
})

enforcedUsers = {}
if (!(fs.existsSync(currentPath+"/data/"))) {
    fs.mkdirSync(currentPath+"/data/")
}
fs.readdir(currentPath+"/data", (err, files) => {
    files.forEach(file => {
        myJSONpath = currentPath+"/data/" + file + "/log.json"
        if (fs.existsSync(myJSONpath)) {
            var data = fs.readFileSync(myJSONpath);
            data = JSON.parse(data);
            enforcedUsers[file] = Object.keys(data)
        } else {
    
        }
    });
  });

client.on('messageCreate', async msg => {
    if (checkAllowed(msg) == false) {
        timeOut(msg)
    } else {
        if (checkUser(msg) == true) {
            addNewMessage(msg)
        }
        if (msg.content.toLocaleLowerCase().startsWith("!setlimit")) {
            setLimit(msg)
            return
        }
        if (msg.content.toLocaleLowerCase().startsWith("!removelimit")) {
            removeLimit(msg)
            return
        }
        if (msg.content.toLocaleLowerCase().startsWith("!resetmessages")) {
            resetmessages(msg)
            return
        }
        if (msg.content.toLocaleLowerCase().startsWith("!help")) {
            msg.channel.send("Set a limit by typing: '!setlimit @username amount.' \nRemove the limit by typing: '!removelimit @username.'\nReset message count by typing: '!resetmessages @username.'")
            return
        }
    }
});



function checkUser(msg) {
    if (enforcedUsers[msg.guildId]) {
        if (enforcedUsers[msg.guildId].includes(msg.author.id)) {
            return true
        }
        return "noUser"
    }
    return "noGuild"
}

function checkAllowed(msg) {
    switch(checkUser(msg)){
        case "noGuild":
        case "noUser":
            return true
        case true:
            myJSONpath = currentPath+"/data/" + msg.guildId + "/log.json"
            if (fs.existsSync(myJSONpath)) {
                var data = fs.readFileSync(myJSONpath);
                data = JSON.parse(data);
                if (data[msg.author.id]["limit"] != "") {
                    msgNumber = data[msg.author.id]["limit"] - data[msg.author.id]["messages"].length
                    if (msgNumber < 0) {
                        return false
                    } else {
                        return true
                    }
                }
            } else {
                return true
            }
    }
}

function timeOut(msg) {
    msg.delete()
    let guild = client.guilds.cache.get(msg.guildId);
    let member = guild.members.cache.get(msg.author.id);
    member.timeout(1 * 60 * 1000, "You have exceeded your daily quota.")
    console.log(`Timed out ${msg.author.username}`)
}

emojiArray = ['0️⃣', '1️⃣','2️⃣','3️⃣','4️⃣','5️⃣' ,'6️⃣','7️⃣', '8️⃣', '9️⃣', '🔟']

async function addNewMessage(msg) {
    myJSONpath = currentPath+"/data/" + msg.guildId + "/log.json"
    if (fs.existsSync(myJSONpath)) {
        var data = fs.readFileSync(myJSONpath);
        data = JSON.parse(data);
        data[msg.author.id]["messages"].push(new Date())
        if (data[msg.author.id]["limit"] != "") {
            tempmessages = []
            today = new Date().getDate()
            for (message of data[msg.author.id]["messages"]) {
                
                if (new Date(message).getDate() == today) {
                    tempmessages.push(message)
                }
            }
            data[msg.author.id]["messages"] = tempmessages;
            emojiNumber = data[msg.author.id]["limit"] - data[msg.author.id]["messages"].length
            if (emojiNumber < 0) {
                timeOut(msg)
                return;
            }
            if (emojiNumber <= 10) {
                msg.react(emojiArray[emojiNumber]);
            }
            fs.writeFile(myJSONpath, JSON.stringify(data, null, 4), (err) => {
                if (err) throw err;
            });
            
        }
    } else {
        return
    }
}


function checkAdmin(msg, member) {
    if (!(member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))) {
        msg.reply("Wow! Calm down there bucko, you're not an admin.")
        return false
    } else {
        return true
    }
}


function removeLimit(msg) {
    msgArray = msg.content.trim().split(/\s+/)
    user = msgArray[1].replace("<@", "").replace(">", "")
    let guild = client.guilds.cache.get(msg.guildId);
    member = guild.members.cache.get(user);
    myJSONpath = currentPath+"/data/" + msg.guildId + "/log.json"
    if (checkAdmin(msg, guild.members.cache.get(msg.author.id)) == false) {
        return
    }
    if (fs.existsSync(myJSONpath)) {
        var data = fs.readFileSync(myJSONpath);
        data = JSON.parse(data);
        if (!data[user]) {
            msg.reply("User doesn't have a limit")
            return
        } else {
            delete data[user];
            delete enforcedUsers[user]
        }
        fs.writeFile(myJSONpath, JSON.stringify(data, null, 4), (err) => {
            if (err) throw err;
            msg.reply(`Limit for user: ${member.user.username}#${member.user.discriminator} removed`)
        });
    } else {
        msg.reply("User doesn't have a limit")
    }
}

function resetmessages(msg) {
    msgArray = msg.content.trim().split(/\s+/)
    user = msgArray[1].replace("<@", "").replace(">", "")
    let guild = client.guilds.cache.get(msg.guildId);
    member = guild.members.cache.get(user);
    myJSONpath = currentPath+"/data/" + msg.guildId + "/log.json"
    if (checkAdmin(msg, guild.members.cache.get(msg.author.id)) == false) {
        return
    }
    if (fs.existsSync(myJSONpath)) {
        var data = fs.readFileSync(myJSONpath);
        data = JSON.parse(data);
        if (!data[user]) {
            msg.reply("User doesn't have a limit")
            return
        } else {
            data[user]['messages'] = [];
        }
        fs.writeFile(myJSONpath, JSON.stringify(data, null, 4), (err) => {
            if (err) throw err;
            msg.reply(`Messages for user: ${member.user.username}#${member.user.discriminator} have been reset`)
        });
    } else {
        msg.reply("User doesn't have a limit")
    }
}

function setLimit(msg) {
    msgArray = msg.content.trim().split(/\s+/)
    user = msgArray[1].replace("<@", "").replace(">", "")
    limit = parseInt(msgArray[2])
    myJSONpath = currentPath+"/data/" + msg.guildId + "/log.json"
    if (user == msg.author.id) {
        msg.reply("You can't change your own limit dummy. 🙂")
        return
    }
    if (user.startsWith("&")) {
        msg.reply("That's a bot -_-")
        return
    }
    let guild = client.guilds.cache.get(msg.guildId);
    let member = guild.members.cache.get(msg.author.id);
    if (checkAdmin(msg, guild.members.cache.get(msg.author.id)) == false) {
        return
    }
    member = guild.members.cache.get(user);
    if (member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        msg.reply("Wow! Calm down there bucko, that's an admin.")
        return
    }
    if (!(Number.isInteger(limit))) {
        msg.reply("That's not a number...")
        return
    }
    if (fs.existsSync(myJSONpath)) {
        var data = fs.readFileSync(myJSONpath);
        data = JSON.parse(data);
        if (!data[user]) {
            data[user] = {}
            data[user]["limit"] = limit
            data[user]["setby"] = msg.author.id
            data[user]["messages"] = []
        } else {
            data[user]["limit"] = limit
            data[user]["setby"] = msg.author.id
        }
        fs.writeFile(myJSONpath, JSON.stringify(data, null, 4), (err) => {
            if (err) throw err;
            switch(checkUser(msg)) {
                case "noUser":
                    enforcedUsers[msg.guildId].push(member.user.id);
                    break;
                case "noGuild":
                    enforcedUsers[msg.guildId] = [];
                    enforcedUsers[msg.guildId].push(member.user.id)
                    break;
                case true:
                    break;
            }
            msg.reply(`Limit for user: ${member.user.username}#${member.user.discriminator} has been set to ${limit}`)
        });
    } else {
        if (fs.existsSync(currentPath+"/data/" + msg.guildId)) {
            fs.writeFile(currentPath+'/data/' + msg.guildId + '/log.json', "{}", (err) => {
                if (err) throw err;
                setLimit(msg)
            })
        } else {
            fs.mkdirSync(currentPath+"/data/" + msg.guildId)
            setLimit(msg)
        }
    }
}


client.login(process.env.CLIENT_TOKEN);