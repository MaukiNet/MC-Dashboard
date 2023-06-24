import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';
import fs from "fs";
import minify from "minify-all-js";
import { getPathOfDocument, generateID, _encode } from './utils';

//Constants
const app = express();
const discord_users:Map<String, Object> = new Map();
const REDIRECT_URL = 'https://discord.com/api/oauth2/authorize?client_id=1108073196667801601&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback&response_type=code&scope=identify';
const REDIRECT_URI = 'http://localhost/callback';

//Configuration
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.text());
app.set('view-engine', 'ejs');

//Things to do before startup
var files = fs.readdirSync(`./public/assets/js`);
files.forEach(file => {
    fs.copyFile(`./public/assets/js/${file}`, `./public/assets/min-js/${file.split(".")[0]}.min.js`, (err) => {
        if(err) throw err;
        console.log(`Successfully copied file`);
    });
})
minify("./public/assets/min-js", {
    comporess_json: true,
    module: false,
    mangle: false,
    packagejson: false,
    all_js: false
});

//Request-Handlers
app.get("/", (req, res) => {
    res.send("<h1>Hello World</h1>");
});

app.get('/callback', async (req, res) => {
    if(!req.query.code) return res.redirect(REDIRECT_URL);
    const code = req.query.code;

    let data = {
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'scope': 'identify'
    };

    var response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: _encode(data),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    var creds = await response.json().catch(err => {console.log(err)});
    const { access_token, token_type } = creds;
    response = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization' : `${token_type} ${access_token}` 
        }
    });

    await response.text().catch(err => console.log(err)).then(text => {
        if(typeof text != 'string') return res.redirect(`/authorization-failed`);
        if(text.startsWith("<")) return res.redirect(`/authorization-failed`);

        var dc_user = JSON.parse(text);
        if(dc_user["message"] == "401: Unauthorized") {
            dc_user = null;
            return res.redirect(`/authorization-failed`)
        }

        dc_user.avatar_url = "https://cdn.discordapp.com/avatars/" + dc_user.id + "/" + dc_user.avatar + ".png";
        res.cookie("token", access_token);
        discord_users.set(access_token, dc_user);
        return res.redirect("/");
    });
});

app.get('/dash', async (req, res) => {
    const access_token:string|undefined = req.cookies["token"];
    if(typeof access_token == 'undefined') return res.redirect('/callback');
    res.render(getPathOfDocument('ejs\\dashboard.ejs'), {
        'discord_user': getDiscordUser(access_token)
    });
});

app.get('/regeln', async (req, res) => {

});

app.get('/mods', async (req, res) => {

});

app.get('/unban', async (req, res) => {
    const access_token:string|undefined = req.cookies["token"];
    if(typeof access_token == 'undefined') return res.redirect('/callback');
    res.render(getPathOfDocument('ejs\\unban\\unbanrequest.ejs'), {
        'discord_user': getDiscordUser(access_token)
    });
});

app.get('/privacy-unban', async (req, res) => {
    res.render(getPathOfDocument("ejs\\privacy-unban.ejs"));
})

app.get('/unbansuccess', async (req, res) => {
    res.render(getPathOfDocument('ejs\\unban\\unbansuccess.ejs'));
});

app.get('/alreadyrequested', async (req, res) => {
    res.render(getPathOfDocument('ejs\\unban\\alreadyrequested.ejs'));
});

app.get(`/assets/:type/:file`, (req, res) => {
    const type = req.params['type'];
    const file = req.params['file'];
    res.sendFile(getPathOfDocument(`assets\\${type}\\${file}`));
})

app.get('/authorization-failed', (req, res) => {
    res.send(`<h1>Oops, something went wrong!</h1>`);
});

app.get('/server-offline', (req, res) => {
    res.render(getPathOfDocument('ejs\\server-offline.ejs'));
});

app.use(async (req, res) => {
    res.status(404).render(getPathOfDocument("ejs\\404.ejs"));
});

app.listen(process.env.PORT, () => {
    console.log(`Launched port ${process.env.PORT}`);
});

/**
 * Get the discord user of a access_token
 * @param access_token The access_token of the user
 * @returns The user
 */
async function getDiscordUser(access_token:string):Promise<any> {
    if(!discord_users.has(access_token)) {
        const response = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                'Authorization' : `Bearer ${access_token}` 
            }
        });
    
        await response.text().catch(err => console.log(err)).then(text => {
            if(typeof text != 'string') return null;
            if(text.startsWith("<")) return null;
    
            var dc_user = JSON.parse(text);
            if(dc_user["message"] == "401: Unauthorized") {
                dc_user = null;
                return null;
            }
    
            dc_user.avatar_url = "https://cdn.discordapp.com/avatars/" + dc_user.id + "/" + dc_user.avatar + ".png";
            discord_users.set(access_token, dc_user);
            return dc_user;
        })
    } else return discord_users.get(access_token);
}