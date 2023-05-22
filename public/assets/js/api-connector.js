//Connect to the API
let state = "booting";
let authenticated = false;

const ws = new WebSocket("ws://localhost:8887");

ws.onopen = (event) => {
    console.log(`Successfully established connection`);
    request(`authenticate`, {"access_token": getCookie("token")});
};

ws.onmessage = (event) => {
    const response_body = JSON.parse(event.data);
    if(state != "w-action-authenticate" && !authenticated) return console.log(`You need to authenticate before using the API`);
    switch(state) {
        case "booting":
            if(response_body['code'] != 401) return console.log("Invalid response");
            console.log(`Successfully authenticated`);
            state = "connected";
            break;
        case "w-action-authenticate":
            if(response_body['code'] == 400) return console.log(response_body['message']);
            if(response_body['code'] == 401) return console.log(response_body['message']);
            if(response_body['code'] == 200) {
                console.log(response_body['message']);
                authenticated = true;
            }
            break;
    }
};

ws.onclose = (event) => console.log(`Lost connection`);

/**
 * Execute a request to the API
 * @param {string} action The action which shall be requested 
 * @param {JSON} request_body 
 */
function request(action, request_body) {
    request_body['action'] = action;
    state = `w-action-${action}`;
    ws.send(request_body);
}

/**
 * Get the value of a cookie
 * @param {string} name The name of the cookie 
 * @returns {string|undefined} The value of the cookie
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }