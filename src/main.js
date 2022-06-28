import { createApp } from "vue";
import App from "./App.vue";
import { createAuth0 } from '@auth0/auth0-vue';
require('dotenv').config()
const app = createApp(App);

app.use(
  createAuth0({
    domain:  process.env.AUTH0_DOMAIN
    client_id:  process.env.AUTH0_CLIENT_ID
    redirect_uri: window.location.origin,
    audience: process.env.AUTH0_AUDIENCE
    cacheLocation: 'localstorage'
  })
);
app.mount("#app");
