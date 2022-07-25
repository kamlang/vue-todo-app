<script>
import TaskBar from "./components/TaskBar.vue"
import Error from "./components/Error.vue"
import TaskList from "./components/TaskList.vue"
import Loading from "./components/Loading.vue"
import Unauthenticated from "./components/Unauthenticated.vue"
import { store } from "./state/state"
export default {
  components: {
    TaskBar,
    Error,
    Loading,
    Unauthenticated,
    TaskList
  },
  data() {
    return {
      store,
      isLoading: this.$auth0.isLoading,
      isAuthenticated: this.$auth0.isAuthenticated,
      errorMessage: "",
    }
  },
  provide() {
    return {
      apiUrl: "192.168.1.6:8443"
    }
  },
  methods: {
    setErrorMessage(errorMessage) {
      this.errorMessage = errorMessage
    },
  },
}
</script>

<template>
  <div class="ui fluid main container">
    <TaskBar @error="setErrorMessage"></TaskBar>
    <div class="wrapper">
      <Loading v-if="isLoading"></Loading>
      <Unauthenticated v-if="!isLoading && !isAuthenticated"></Unauthenticated>
      <Error v-if="errorMessage" @closed="errorMessage = ''" :errorMessage="errorMessage"></Error>
      <TaskList @error="setErrorMessage" v-if="isAuthenticated && !isLoading" />
    </div>
  </div>
</template>
<style scoped>
.main.container {
  height: 100vh;
  overflow: auto;
  background: rgb(27, 28, 29);
  background: linear-gradient(
    180deg,
    rgba(27, 28, 29, 1) 0%,
    rgba(36, 116, 116, 1) 100%
  );
}
.wrapper {
  max-width: min(95%, 900px);
  margin-left: auto;
  margin-right: auto;
}

@media screen and (max-width: 700px) {
  .wrapper {
    max-width: 100%;
  }
}
</style>