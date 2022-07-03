
<script>
import Calendar from "./Calendar.vue"
import axios from "axios"
import FadeTransition from "./FadeTransition.vue"
export default {
  emits: ['toggleShowCompleted', 'newTaskCreated', 'error'],
  inject: ['apiUrl'],
  components: {
    Calendar,
    FadeTransition
  },

  data() {
    return {
      newTaskBody: "",
      newTaskTitle: "",
      newTaskDueDate: "",
      showCompletedTasks: false,
      showTaskForm: false,
    }
  },
  props: {
    selectedTaskList: String
  },
  watch: {
    selectedTaskList() {
      this.showTaskForm = false
      this.$refs.toggleShowCompletedCheckbox.checked = false
      this.newTaskDueDate = ""
      this.newTaskBody = ""
      this.newTaskTitle = ""
    },
  },
  methods: {
    toggleShowCompleted() {
      this.showCompletedTasks = !this.showCompletedTasks
      this.$emit('toggleShowCompleted', this.showCompletedTasks)
    },
    setDueDateHandler(date) {
      this.newTaskDueDate = date
    },
    async addTask() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await axios.put("https://" + this.apiUrl + "/addTask",
          {
            name: this.selectedTaskList,
            title: this.newTaskTitle,
            body: this.newTaskBody,
            dueDate: this.newTaskDueDate,
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        const data = await response.data
        this.$emit('newTaskCreated', data)
        this.$emit('error', '')
        this.newTaskBody = ""
        this.newTaskDueDate = ""
        this.newTaskTitle = ""
      } catch (e) {
        console.log(e)
      }
    },
  }
}
</script>

<template>
  <div
    class="ui segment"
    tabindex="0"
    @keydown.space.prevent="showTaskForm = !showTaskForm"
    @click="showTaskForm = !showTaskForm"
    title="Create a new task."
  >
    <div
      :title="showCompletedTasks ? 'Hide completed tasks.' : 'Show completed tasks.'"
      data-test-id="toggle-show-completed"
      @keydown.space.stop="toggleShowCompleted"
      class="ui toggle checkbox right floated"
      @click.stop="toggleShowCompleted"
    >
      <input ref="toggleShowCompletedCheckbox" type="checkbox" name="public" />
      <label></label>
    </div>
    <i v-if="showTaskForm" class="angle up icon"></i>
    <i v-else class="angle down icon"></i>
  </div>

  <FadeTransition>
    <div v-if="showTaskForm" class="ui clearing segment">
      <form class="ui form">
        <div class="field">
          <input v-model="newTaskTitle" placeholder="Give a title to this task..." />
        </div>
        <div class="field">
          <label></label>
          <textarea rows="8" v-model="newTaskBody" placeholder="Add a task..."></textarea>
        </div>
        <Calendar :active="true" :injectedDueDate="newTaskDueDate" @dueDateSet="setDueDateHandler"></Calendar>
        <div v-if="newTaskBody" class="field">
          <div
            @submit.prevent
            @click="addTask"
            @keydown.enter="addTask"
            class="ui button"
            tabindex="0"
          >
            <i class="calendar plus icon"></i>
            Add Task
          </div>
        </div>
      </form>
    </div>
  </FadeTransition>
</template>

<style scoped>
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
.checkbox[class*="vertical align"] {
  vertical-align: middle;
}
</style>