<script>

import TaskList from "./components/TaskList.vue"
import TaskBar from "./components/TaskBar.vue"

export default {
  components: {
    TaskBar,
    TaskList,
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
  <TaskList :selectedTaskList="selectedTaskList"></TaskList>
</template>