# TUNE
### An open-source Discord Music Bot written in typescript.

<br>

# Installation and testing
**NPM** :

```
npm install --production=false
npm test
```
# Config files
**credentials.json**
```js
{
    //Discord bot login credentials
    "discord": {
        "token": "yourdiscordbottokenhere",
        "client_id": "1234567890123456",
        "client_secret": "y0Ur-cLi3nt_$ecret@here"
    },
    //Mongodb connection config
    "mongodb": {
        "uri": "mongodb_uri_here",
        "dbName": "name_of_database_to_use"
    },
    //Lavalink config
    "lavalink": {
        //Array of multiple nodes
        "nodes": [
            {
                "host": "host_ip",
                "port": 7000,
                "password": "youshallnotpass"
            }
        ]
    },
    //Spotify API auth
    "spotify": {
        "client_id": "spotify_client_token",
        "client_secret": "spotify_client_secret"
    },
    //KSoft.Si API credentials
    "ksoft": {
        "token": "ksoft_tokenv1",
        "tokenv2": "ksoft_tokenv2"
    },
    "topgg": {
        "token": "topgg_token"
    }
}
```
**settings.json**
```js
{
    "shardingManager": {
        //Number of shards
        //Currently limited to 1 as no way of communication between shards
        "totalShards": 1 
    },
    //Client activity settings
    "default_activity_status": {
        //Supported values for type-https://discord.com/developers/docs/topics/gateway#activity-object-activity-flags
        "type": 2,
        "text": "I_love_open_source",
        //Interval to refresh this as it becomes empty sometimes if not refreshed
        "updateInterval": 10000
    },
    //Permissions included in the generated invite link using invite command
    "default_invite_permissions": 536346111,
    //Default cooldown for a user using any command
    "default_command_cooldown": 10000,
    //Other info
    "info": {
        "websiteURL": "https://ririchiyobot.wixsite.com/ririchiyo",
        "premiumURL": "https://discord.gg/XgwdeEv",
        "supportServerURL": "https://discord.gg/XgwdeEv",
        "version": "0.9.0",
        "library": "discord.js@12.0.0",
        "hosting": "localhost/dev",
        "externalSites": {
            "top.gg": "https://top.gg/bot/696661803182194698"
        }
    }
}
```
**owners.json**
```js
//An array of owner objects
[
    {
        "name": "ParasDeshpande",
        "username": "Styxo",
        "id": "429035988732346368",
        "github": "https://github.com/Styxo",
        "contact": "parasbpndeshpande@gmail.com",
        "profileURL": "https://dsc.bio/styxo"
    }
]
```
**appearance.json**
```js
{
    //Colour hex codes for different situations in embeds
    "colours": {
        "general": "#CA98FF",
        "error": "#FF0000",
        "restricted": "#FFAA00",
        "warn": "#FFD030",
        "info": "#46A0FF",
        "processing": "#FFCC00",
        "success": "#2ECC71"
    },
    //Emojis used by the bot, list of emoji IDs
    "emojis": {
        "general": "",
        "error": "",
        "restricted": "797853430638968832",
        "warn": "797855064810455050",
        "info": "",
        "processing": "",
        "success": "",
        "online": "797853430541451264",
        "idle": "797853430873980948",
        "dnd": "797853430226878525",
        "offline": "797853430533849088",
        "ping_pong": "797853964061769748",
        "hourglass": "",
        "stopwatch": "",
        "heartbeat": "",
        "like": "797857521304862720",
        "shuffle": "797857520848076832",
        "previous_track": "797857521025024031",
        "play_or_pause": "797857521573691462",
        "next_track": "797857520973512706",
        "loop": "797857521237753940",
        "stop": "797857521297522738",
        "disconnect": "797855294713233468",
        "arrow_up": "797855294712709160",
        "arrow_down": "797855294712709160",
        "arrow_left": "797855294456725506",
        "arrow_right": "797855294558044181",
        "musical_note": "797855786465361952",
        "musical_notes": "797855786705485824",
        "playing": "797855786965401640",
        "voice_channel_icon_normal": "797856559752413274",
        "voice_channel_icon_normal_locked": "797856559827910726",
        "voice_channel_icon_error_locked": "797856559639691304",
        "text_channel_icon_normal": "797856559711256606",
        "text_channel_icon_normal_locked": "797856559592898600",
        "text_channel_icon_error_locked": "797856559598010368",
        "animated_panda_happy": "797854407911800853"
    }
}
```
**defaults/default_guild_settings.json** - [default values for the guild settings]
```js
{
    "prefix": "t!"
}
```
---
## Commands:
#
< To Be Updated! >
#
> ### `play`
> Play a track using Spotify/YouTube/Soundcloud link or a song title.
> #### Example:
> ```
> t!play https://youtu.be/dQw4w9WgXcQ
> ```

> ### `play`
> Play a track using Spotify/YouTube/Soundcloud link or a song title.
> #### Example:
> ```
> t!play https://youtu.be/dQw4w9WgXcQ
> ```


## Contributors
👤 [**TheStyxo**](https://styxo.codes)

- Author
- Website - https://styxo.codes/
- Github: [@TheStyxo](https://github.com/TheStyxo)