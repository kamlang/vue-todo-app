
<script>
import Calendar from "./Calendar.vue"
import axios from "axios"
import FadeTransition from "./FadeTransition.vue"
export default {
  emits: ['toggleShowCompleted', 'newTaskCreated', 'error'],
  components: {
    Calendar,
    FadeTransition
  },
  data() {
    return {
      newTask: "",
      showCompleted: false,
      showTaskForm: false,
      dueDate: "",
      activeCalendar: true
    }
  },
  props: {
    selectedTaskList: String
  },
  watch: {
    selectedTaskList() {
      this.showTaskForm = false
      this.dueDate = ""
      this.newTask = ""
    },
  },
  methods: {
    toggleShowCompleted() {
      this.$emit('toggleShowCompleted', this.showCompleted)
    },
    setDueDateHandler(date) {
      this.dueDate = date
    },
    async addTask() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await axios.put("http://localhost:8080/addTask",
          {
            body: this.newTask,
            dueDate: this.dueDate,
            name: this.selectedTaskList
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
        this.newTask = ""
        this.dueDate = ""
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
  >
    <div
      :data-tooltip="showCompleted ? 'Hide completed tasks' : 'Show completed tasks'"
      @keydown.space.stop="showCompleted = !showCompleted"
      class="ui toggle checkbox right floated"
      @click.stop="toggleShowCompleted"
    >
      <input type="checkbox" name="public" />
      <label></label>
    </div>
    <i v-if="showTaskForm" class="angle up icon"></i>
    <i v-else class="angle down icon"></i>
  </div>

  <FadeTransition>
    <div v-if="showTaskForm" class="ui clearing segment">
      <div class="ui form">
        <div class="field">
          <label></label>
          <textarea rows="8" v-model="newTask" placeholder="Add a task ..."></textarea>
        </div>
        <Calendar :active="true" :injectedDueDate="dueDate" @dueDateSet="setDueDateHandler"></Calendar>
        <button
          v-if="newTask"
          data-tooltip="Add a new task"
          class="ui button icon right floated"
          @click="addTask"
        >
          <i class="calendar plus icon"></i>
        </button>
      </div>
    </div>
  </FadeTransition>
</template>

<style scoped>
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
</style>