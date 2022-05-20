<script>
import LoginPage from "./components/LoginPage.vue"
import LogoutPage from "./components/LogoutPage.vue"
import Todos from "./components/Todos.vue"
export default {
  components : {
    LoginPage,
    LogoutPage,
    Todos
},
 
}
</script>

<template>
<div class="ui fluid main container">
  <div class="ui pointing inverted menu">
    <a class="icon active item">
    <i class="tasks icon"> Todos</i>
    </a>
  <div class="right menu">
  <LoginPage></LoginPage>
  <LogoutPage></LogoutPage>
  </div>
</div>
   <Todos></Todos>
  </div>
</template>