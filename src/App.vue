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
      isAuthenticated: this.$auth0.isAuthenticated,
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
  <div class="ui fluid main container">
    <Suspense>
      <TaskBar @error="setErrorMessage"></TaskBar>
      <div class="wrapper">
        <Unauthenticated v-if="!isAuthenticated"></Unauthenticated>
        <Error v-if="errorMessage" @closed="errorMessage = ''" :errorMessage="errorMessage"></Error>
        <TaskList @error="setErrorMessage" v-if="isAuthenticated" />
      </div>
      <template #fallback>
        <Loading></Loading>
      </template>
    </Suspense>
  </div>
</template>
<style scoped>
.main.container {
  height: 100vh;
  overflow: auto;
  background: rgb(27, 28, 29);
  background: linear-gradient(
    rgba(27, 28, 29, 1) 100%,
    rgba(36, 116, 116, 1) 0%
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