<script>
import LoginPage from "./LoginPage.vue"
import LogoutPage from "./LogoutPage.vue"
import Warning from "./Warning.vue"
import axios from 'axios'

export default {
  emits: ['taskListSelected'],
  components: {
    LoginPage,
    LogoutPage,
    Warning
  },
  data() {
    return {
      taskListArray: [],
      user: this.$auth0.user,
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
      this.creatingNewTaskList = false
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
      } catch (e) {
        console.log(e)
      }
      this.newTaskListName = ""
      this.creatingNewTaskList = false
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
        this.taskListToDelete = ""
        this.taskListArray = this.taskListArray.filter(task => task != todo)
        setSelectedTaskList(this.taskListArray[0])
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
      this.selectedTaskList = this.taskListArray[0]
      this.$emit('taskListSelected', this.selectedTaskList)
    } catch (e) {
      console.log(e)
    }
  }
}

</script>

<template>
  <div class="ui taskmenu inverted pointing menu">
    <div class="left menu">
      <div class="item">
        <i class="user icon"></i>
        {{ user.nickname }}
      </div>
    </div>
    <a
      v-for="taskList in taskListArray"
      class="item"
      @click="setSelectedTaskList(taskList)"
      :class="selectedTaskList == taskList && 'active'"
    >
      <i class="tasks icon"></i>
      {{ taskList }}
      <span v-if="taskList == selectedTaskList" data-position="bottom center">
        <i class="delete icon" @click.stop="taskListToDelete = taskList"></i>
      </span>
    </a>

    <a class="item" v-if="creatingNewTaskList">
      <div class="ui action input">
        <input v-model="newTaskListName" type="text" placeholder="New task list name..." />
        <div v-if="newTaskListName" class="ui button" @click="CreateTaskList">
          <i class="check icon"></i>
        </div>
        <div v-else class="ui button" @click="creatingNewTaskList = !creatingNewTaskList">
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

  <Warning
    class="ui text container"
    v-if="taskListToDelete"
    @No="taskListToDelete = ''"
    @Yes="deleteTodo(taskListToDelete)"
    :message="'Are you sure you want to delete this task list ?'"
  ></Warning>
</template>
<style scoped>
.taskmenu {
  min-height: 50px;
  overflow-x: auto !important;
  overflow-y: hidden !important;
}
</style>