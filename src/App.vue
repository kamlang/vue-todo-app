<script>
import TaskBar from "./components/TaskBar.vue"
import Error from "./components/Error.vue"
import FadeTransition from "./components/FadeTransition.vue"
import TaskList from "./components/TaskList.vue"

export default {
  components: {
    TaskBar,
    Error,
    FadeTransition,
    TaskList
  },
  data() {
    return {
      errorMessage: "",
      isLoading: this.$auth0.isLoading,
      isAuthenticated: this.$auth0.isAuthenticated,
      selectedTaskList: ""
    }
  },
  methods: {
    setErrorMessage(errorMessage) {
      this.errorMessage = errorMessage
    },
    setSelectedTaskList(taskList) {
      this.selectedTaskList = taskList
    }
  },
}
</script>

<template>
  <div class="ui fluid main container">
    <TaskBar @taskListSelected="setSelectedTaskList" @error="setErrorMessage"></TaskBar>
    <FadeTransition>
      <div style="margin-bottom: 16px;" v-if="errorMessage">
        <Error @closed="errorMessage = ''" :errorMessage="errorMessage"></Error>
      </div>
    </FadeTransition>
    <TaskList
      @error="setErrorMessage"
      v-if="isAuthenticated && !isLoading"
      :selectedTaskList="selectedTaskList"
    ></TaskList>
  </div>
</template>