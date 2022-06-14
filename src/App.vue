<script>
import TaskBar from "./components/TaskBar.vue"
import Error from "./components/Error.vue"
import FadeTransition from "./components/FadeTransition.vue"
import TaskList from "./components/TaskList.vue"
import Loading from "./components/Loading.vue"
import Unauthenticated from "./components/Unauthenticated.vue"

export default {
  components: {
    TaskBar,
    Error,
    FadeTransition,
    Loading,
    Unauthenticated,
    TaskList
  },
  data() {
    return {
      errorMessage: "",
      isLoading: this.$auth0.isLoading,
      isAuthenticated: this.$auth0.isAuthenticated,
      selectedTaskList: "",
      refreshTaskBar: false
    }
  },
  methods: {
    setErrorMessage(errorMessage) {
      this.errorMessage = errorMessage
    },
    setSelectedTaskList(taskList) {
      this.selectedTaskList = taskList
    },
    handleRefreshTaskBar() {
      this.refreshTaskBar = !this.refreshTaskBar
    }
  },
}
</script>

<template>
  <div class="ui fluid main container">
    <TaskBar
      :refreshTaskBar="refreshTaskBar"
      @taskListSelected="setSelectedTaskList"
      @error="setErrorMessage"
    ></TaskBar>
    <Loading v-if="isLoading"></Loading>
    <Unauthenticated v-if="!isLoading && !isAuthenticated"></Unauthenticated>
    <FadeTransition>
      <div style="margin-bottom: 16px;" v-if="errorMessage">
        <Error @closed="errorMessage = ''" :errorMessage="errorMessage"></Error>
      </div>
    </FadeTransition>
    <TaskList
      @refreshTaskBar="handleRefreshTaskBar"
      @error="setErrorMessage"
      v-if="isAuthenticated && !isLoading"
      :selectedTaskList="selectedTaskList"
    ></TaskList>
  </div>
</template>