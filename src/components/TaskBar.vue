<script>
import LoginPage from "./LoginPage.vue"
import LogoutPage from "./LogoutPage.vue"
import axios from 'axios'

export default {
  emits: ['taskListSelected'],
  components: {
    LoginPage,
    LogoutPage,
  },
  data() {
    return {
      taskListArray: [],
      selectedTaskList: "",
      taskListToDelete: "",
      newTaskListName: "",
      creatingNewTaskList: false,
    }

  },

  methods: {
    setSelectedTaskList(taskList) {
      this.$emit('taskListSelected', taskList)
      this.selectedTaskList = taskList
    },
    async CreateTaskList() {
      const accessToken = await this.$auth0.getAccessTokenSilently();

      try {
        const response = await axios.put("http://localhost:8080/CreateTaskList",
          {
            name: this.newTaskListName
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        await response.data;
        this.taskListArray.push(this.newTaskListName)
        this.$emit('taskListSelected', newTaskListName)
        this.newTaskListName = ""
        this.creatingNewTaskList = false
      } catch (e) {
        this.newTaskListName = ""
        this.creatingNewTaskList = false
      }
    },
    async deleteTodo(todo) {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
        await axios.delete("http://localhost:8080/deleteTodo", {
          data: {
            name: todo
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          },
        })
        this.taskListArray = this.taskListArray.filter(td => td != todo)
        this.taskListToDelete = ""
        this.$emit('taskListSelected', this.taskListArray[0])
      } catch (e) {
        console.log(e)
      }
    }
  },
  async mounted() {
    const accessToken = await this.$auth0.getAccessTokenSilently();
    try {
      const response = await axios.get("http://localhost:8080/getTodos", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      const data = await response.data
      this.taskListArray = data.map(item => item.name)
      this.$emit('taskListSelected', this.taskListArray[0])
    } catch (e) {
      console.log(e)
    }
  }
}

</script>

<template>
  <div class="ui stackable pointing menu">
    <a
      v-for="taskList in taskListArray"
      class="item"
      @click="setSelectedTaskList(taskList)"
      :class="selectedTaskList == taskList && 'active'"
    >
      <i class="tasks icon"></i>
      {{ taskList }}
      <span
        v-if="taskList == selectedTaskList"
        data-tooltip="Delete this task list"
        data-position="bottom center"
      >
        <i class="delete icon" @click.stop="taskListToDelete = taskList"></i>
      </span>
    </a>

    <a class="item" v-if="creatingNewTaskList">
      <div class="ui action input">
        <input v-model="newTaskListName" type="text" placeholder="New task list name..." />
        <div v-if="newTaskListName" class="ui button" @click="CreateTaskList">
          <i class="check icon"></i>
        </div>
        <div v-else class="ui button" @click="CreateTaskList">
          <i class="redo icon"></i>
        </div>
      </div>
    </a>

    <a class="item" @click="creatingNewTaskList = !creatingNewTaskList">
      <i class="plus icon"></i> Add a new task list
    </a>

    <div class="right menu">
      <LoginPage></LoginPage>
      <LogoutPage></LogoutPage>
    </div>
  </div>

  <div v-if="taskListToDelete" class="ui text container small icon negative message yellow">
    <i class="delete icon"></i>
    <div class="ui text container">
      Are you sure you want to delete this todo list ?
      <div class="ui right floated button" @click="taskListToDelete = ''">No</div>
      <div class="ui right floated button" @click="deleteTodo(taskListToDelete)">Yes</div>
    </div>
  </div>
</template>