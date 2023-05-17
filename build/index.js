"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("./utils");
const app = (0, express_1.default)();
const REDIRECT_URL = 'https://discord.com/api/oauth2/authorize?client_id=1108073196667801601&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback&response_type=code&scope=identify';
const REDIRECT_URI = 'http://localhost/callback';
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.text());
app.set('view-engine', 'ejs');
app.get("/", (req, res) => {
    res.send("<h1>Hello World</h1>");
});
app.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.query.code)
        res.redirect(REDIRECT_URL);
    const code = req.query.code;
    let data = {
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'scope': 'identify'
    };
    var response = yield (0, node_fetch_1.default)('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: (0, utils_1._encode)(data),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    var creds = yield response.json().catch(err => { console.log(err); });
    console.log(`${JSON.stringify(creds)}`);
    const { access_token, token_type } = creds;
    response = yield (0, node_fetch_1.default)('https://disord.com/api/user/@me', {
        headers: {
            authorization: `${token_type} ${access_token}`
        }
    });
    var dc_user = yield response.json().catch(err => { console.log(err); });
    if (dc_user["message"] == "401: Unauthorized")
        dc_user = null;
    else
        dc_user.avatar_url = "https://cdn.discordapp.com/avatars/" + dc_user.id + "/" + dc_user.avatar + ".png";
    res.cookie("token", access_token);
    console.log(`ID: ${dc_user['id']}`);
    return res.redirect("/");
}));
app.listen(process.env.PORT, () => {
    console.log(`Launched port ${process.env.PORT}`);
});
