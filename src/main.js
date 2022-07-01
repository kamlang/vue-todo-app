import { createApp } from "vue";
import App from "./App.vue";
import { createAuth0 } from '@auth0/auth0-vue';
const app = createApp(App);

app.use(
  createAuth0({
    domain: "dev-vbe2rs37.us.auth0.com",
    client_id: "IsQUjlKUUTfOwp6Da1SQg8uUL0cHf0Nw",
    redirect_uri: window.location.origin,
    audience: "htts://glgmsh.com",
    cacheLocation: 'localstorage'
  })
);
app.mount("#app");
