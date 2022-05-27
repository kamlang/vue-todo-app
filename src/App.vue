<script>

import Todos from "./components/Todos.vue"
import TaskBar from "./components/TaskBar.vue"

export default {
  components: {
    TaskBar,
    Todos,
  },
  data() {
    return {
      selectedTaskList: "",
    }
  },
  methods: {
    setSelectedTaskList(taskList) {
      this.selectedTaskList = taskList
    }
  }
}
</script>

<template>
  <TaskBar @taskListSelected="setSelectedTaskList"></TaskBar>
  <Todos :selectedTaskList="selectedTaskList"></Todos>
</template>

<style scoped>
.icon[class*="right floated"],
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
</style>