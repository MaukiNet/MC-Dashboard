import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';
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
    var resp = await fetch('http://localhost:8080/online_players', {
        method: 'GET',
        headers: {
            'Authorization': access_token
        }
    });
    await resp.json().catch(err => {return res.render(getPathOfDocument(`ejs\\server-offline.ejs`))}).then(data => {
        res.render(getPathOfDocument('ejs\\dashboard.ejs'), {
            'discord_user': getDiscordUser(access_token),
            'online_players': data
        });
    });
});

app.get('/authorization-failed', (req, res) => {
    res.send(`<h1>Oops, something went wrong!</h1>`);
});

app.get('/server-offline', (req, res) => {
    res.render(getPathOfDocument('ejs\\server-offline.ejs'));
});

app.listen(process.env.PORT, () => {
    console.log(`Launched port ${process.env.PORT}`);
});

//Functions
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