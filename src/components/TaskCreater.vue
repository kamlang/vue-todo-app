
<script>
import Calendar from "./Calendar.vue"
import axios from "axios"
import moment from "moment"
export default {
  emits: ['toggleShowCompleted'],
  components: {
    Calendar
  },
  data() {
    return {
      newTask: "",
      showCompleted: false,
      showCalendar: false,
      showTaskForm: false,
      dueDate: Date
    }
  },
  props: {
    selectedTaskList: String
  },
  computed: {
    formatedDueDate() {
      return this.dueDate instanceof Date ? moment(this.dueDate).format("LL") : ""
    },
  },
  methods: {
    toggleShowCompleted() {
      this.$emit('toggleShowCompleted', this.showCompleted)
    },
    setDueDate(date) {
      this.dueDate = date
      this.showCalendar = false
    },
    unSetDueDate() {
      this.dueDate = ""
      this.showCalendar = false
    },
    async addTask() {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
        const response = await axios.put("http://localhost:8080/addTask",
          {
            body: this.newTask,
            duedate: this.dueDate instanceof Date ? this.dueDate.toString() : "",
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
  <div class="ui segment" @click="showTaskForm = !showTaskForm">
    <div
      :data-tooltip="showCompleted ? 'Hide completed tasks' : 'Show completed tasks'"
      class="ui toggle checkbox right floated"
      @click.stop="toggleShowCompleted"
    >
      <input type="checkbox" name="public" />
      <label></label>
    </div>
    <i v-if="showTaskForm" class="angle up icon"></i>
    <i v-else class="angle down icon"></i>
  </div>

  <div v-if="showTaskForm" class="ui clearing segment">
    <div class="ui form">
      <div class="field">
        <label></label>
        <textarea rows="8" v-model="newTask" placeholder="Add a task ..."></textarea>
      </div>
      <div
        class="ui input left icon"
        data-tooltip="Schedule task to a specific day"
        @click="showCalendar = !showCalendar"
      >
        <i class="calendar icon floated"></i>
        <input
          :value="formatedDueDate"
          @keydown.delete="unSetDueDate"
          @keydown.esc="showCalendar = false"
          type="text"
          placeholder="Date/Time"
        />
      </div>

      <Calendar
        v-if="showCalendar"
        @unSetDate="unSetDueDate"
        @setDate="setDueDate"
        :dueDate="dueDate"
      ></Calendar>
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
</template>

<style scoped>
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
</style>