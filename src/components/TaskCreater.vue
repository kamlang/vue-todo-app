
<script>
import Calendar from "./Calendar.vue"
import FadeTransition from "./FadeTransition.vue"

import { store } from '../state/state'
import { httpRequest } from "../lib/httpRequest"

export default {
  emits: ['toggle-show-completed', 'error'],
  components: {
    Calendar,
    FadeTransition
  },

  data() {
    return {
      store,
      newTask: {
        body: "",
        title: "",
        dueDate: "",
      },
      showCompletedTasks: false,
      showTaskForm: false,
      selectedProject: Object
    }
  },

  watch: {

    selectedProject() {
      this.showTaskForm = false
      this.$refs.toggleShowCompletedCheckbox.checked = false
      this.newTask.dueDate = ""
      this.newTask.body = ""
      this.newTask.title = ""
    },
  },

  mounted() {
    this.selectedProject = this.store.selectedProject
  },

  methods: {

    toggleShowCompleted() {
      this.showCompletedTasks = !this.showCompletedTasks
      this.$emit('toggle-show-completed')
    },

    handleSetDueDate(date) {
      this.newTask.dueDate = date
    },

    async addTask() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();

        const response = await httpRequest(accessToken,
          "put",
          "/addTask",
          {
            name: this.store.selectedProject.name,
            title: this.newTask.title,
            body: this.newTask.body,
            dueDate: this.newTask.dueDate,
          },
        )
        this.store.addTaskToSelectedProject(response)
        this.$emit('error', '')
        this.newTask.body = ""
        this.newTask.dueDate = ""
        this.newTask.title = ""
        this.showTaskForm = false
      } catch (e) {
        console.log(e)
      }
    },
  }
}
</script>

<template>
  <div
    class="ui segment secondary"
    data-test-id="task-creater"
    tabindex="0"
    @keydown.space="showTaskForm = !showTaskForm"
    @keydown.enter="showTaskForm = !showTaskForm"
    @click="showTaskForm = !showTaskForm"
    :title="showTaskForm ? 'Hide new task panel.' : 'Show new task panel.'"
  >
    <div
      :title="showCompletedTasks ? 'Hide completed tasks.' : 'Show completed tasks.'"
      data-test-id="toggle-show-completed"
      @keydown.space.stop="toggleShowCompleted"
      @click.stop="toggleShowCompleted"
      class="ui toggle checkbox right floated"
    >
      <input ref="toggleShowCompletedCheckbox" type="checkbox" name="public" />
      <label></label>
    </div>
    <i v-if="showTaskForm" class="angle up icon"></i>
    <div v-else>
      Add a new task
      <i class="angle down icon"></i>
    </div>
  </div>

  <FadeTransition>
    <div v-if="showTaskForm" class="ui clearing segment">
      <form class="ui form">
        <div class="field">
          <input
            data-test-id="task-title"
            v-model="newTask.title"
            placeholder="Give a title to this task..."
          />
        </div>
        <div class="field">
          <label></label>
          <textarea
            data-test-id="task-body"
            rows="8"
            v-model="newTask.body"
            placeholder="Add a task..."
          ></textarea>
        </div>
        <Calendar
          :active="true"
          :injectedDueDate="newTask.dueDate"
          @dueDateSet="handleSetDueDate
          "
        ></Calendar>
        <div v-if="newTask.body" class="field">
          <div
            data-test-id="add-task-button"
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
.segment {
  border-radius: 5px !important;
}
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
.checkbox[class*="vertical align"] {
  vertical-align: middle;
}
</style>