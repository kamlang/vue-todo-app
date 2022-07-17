<script>
import TaskBar from "./components/TaskBar.vue"
import Error from "./components/Error.vue"
import FadeTransition from "./components/FadeTransition.vue"
import TaskList from "./components/TaskList.vue"
import Loading from "./components/Loading.vue"
import Unauthenticated from "./components/Unauthenticated.vue"
import Notification from "./components/Notification.vue"

export default {
  components: {
    TaskBar,
    Error,
    FadeTransition,
    Loading,
    Notification,
    Unauthenticated,
    TaskList
  },
  data() {
    return {
      isLoading: this.$auth0.isLoading,
      isAuthenticated: this.$auth0.isAuthenticated,
      errorMessage: "",
      selectedTaskList: {},
      refreshTaskBar: false,
      tasksToNotify: [],
      taskToUpdate: {}
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
    setSelectedTaskList(taskList) {
      this.selectedTaskList = taskList
    },
    handleRefreshTaskBar() {
      this.refreshTaskBar = !this.refreshTaskBar
    },
    newNotificationsHandler(taskToNotifyArray) {
      this.tasksToNotify = taskToNotifyArray
    },
    markTaskAsCompletedHandler(task) {
      task.completed = true
      this.taskToUpdate = task
      this.tasksToNotify = this.tasksToNotify.
        filter(t => t._id !== task._id)
    },
    dismissTaskReminderHandler(task) {
      task.dueDate = ""
      this.taskToUpdate = task
      this.tasksToNotify = this.tasksToNotify.
        filter(t => t._id !== task._id)
    },
  },
}
</script>

<template>
  <div class="ui fluid main container">
    <TaskBar
      :refreshTaskBar="refreshTaskBar"
      @taskListSelected="setSelectedTaskList"
      @error="setErrorMessage"
      @newNotifications="newNotificationsHandler"
    ></TaskBar>
    <div class="wrapper">
      <Loading v-if="isLoading"></Loading>
      <Unauthenticated v-if="!isLoading && !isAuthenticated"></Unauthenticated>
      <Notification
        v-if="isAuthenticated && !isLoading"
        @markTaskAsCompleted="markTaskAsCompletedHandler"
        @dismissTaskReminder="dismissTaskReminderHandler"
        v-for="task in tasksToNotify"
        :task="task"
      ></Notification>
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
        :taskToUpdate="taskToUpdate"
      ></TaskList>
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
  max-width: min(95%, 960px);
  margin-left: auto;
  margin-right: auto;
}

@media screen and (max-width: 700px) {
  .wrapper {
    max-width: 100%;
  }
}
</style>