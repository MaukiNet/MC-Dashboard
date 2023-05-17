import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';
import { getPathOfDocument, generateID, _encode } from './utils';

const app = express();

const REDIRECT_URL = 'https://discord.com/api/oauth2/authorize?client_id=1108073196667801601&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback&response_type=code&scope=identify';
const REDIRECT_URI = 'http://localhost/callback'

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.text());
app.set('view-engine', 'ejs');

app.get("/", (req, res) => {
    res.send("<h1>Hello World</h1>");
});

app.get('/callback', async (req, res) => {
    if(!req.query.code) res.redirect(REDIRECT_URL)
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
    console.log(`${JSON.stringify(creds)}`);
    const { access_token, token_type } = creds;
    response = await fetch('https://disord.com/api/user/@me', {
        headers: {
            authorization: `${token_type} ${access_token}` 
        }
    });
    var dc_user = await response.json().catch(err => {console.log(err)});
    if(dc_user["message"] == "401: Unauthorized") dc_user = null;
    else dc_user.avatar_url = "https://cdn.discordapp.com/avatars/" + dc_user.id + "/" + dc_user.avatar + ".png";
    res.cookie("token", access_token);
    console.log(`ID: ${dc_user['id']}`);
    return res.redirect("/");
});

app.listen(process.env.PORT, () => {
    console.log(`Launched port ${process.env.PORT}`);
})