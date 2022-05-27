<script>

import Todos from "./components/Todos.vue"
import Error from "./components/Error.vue"
import TaskBar from "./components/TaskBar.vue"

export default {
  components: {
    TaskBar,
    Todos,
    Error,
  },
  data() {
    return {
      selectedTaskList: "",
      errorMessage: "",
    }
  },
  methods: {
    setSelectedTaskList(taskListName) {
      this.selectedTaskList = taskListName

    }
  }


}
</script>

<template>
  <div class="ui main container">
    <TaskBar @taskListSelected="setSelectedTaskList"></TaskBar>

    <Error :errorMessage="errorMessage" @closed="errorMessage = ''"></Error>
    <Todos :selectedTaskList="selectedTaskList"></Todos>
  </div>
</template>
<style scoped>
.icon[class*="right floated"],
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
</style>