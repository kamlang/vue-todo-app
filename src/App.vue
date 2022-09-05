<script>
import ProjectBar from "./components/ProjectBar.vue"
import Error from "./components/Error.vue"
import TaskList from "./components/TaskList.vue"
import Loading from "./components/Loading.vue"
import Unauthenticated from "./components/Unauthenticated.vue"
import { store } from "./state/state"
export default {
  components: {
    ProjectBar,
    Error,
    Loading,
    Unauthenticated,
    TaskList
  },
  data() {
    return {
      store,
      isAuthenticated: this.$auth0.isAuthenticated,
      isLoading: this.$auth0.isLoading,
      errorMessage: "",
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
  <div class="main container">
    <ProjectBar @error="setErrorMessage"></ProjectBar>
    <div class="wrapper">
      <Loading v-if="isLoading"></Loading>
      <Unauthenticated v-if="!isAuthenticated && !isLoading"></Unauthenticated>
      <Error
        v-if="isAuthenticated && errorMessage"
        @closed="errorMessage = ''"
        :errorMessage="errorMessage"
      ></Error>
      <TaskList v-if="isAuthenticated" @error="setErrorMessage" />
    </div>
  </div>
</template>
<style scoped>
.main.container {
  padding-top: 4em;
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