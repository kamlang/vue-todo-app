<script>
import moment from "moment"
export default {
    data () {
        return {
        user: this.$auth0.user,
        tasks : [],
        newTask: "",
        showCompleted : false
        }
    },
    computed : {
        formatedTask () {
            return this.tasks.map(task => {
                task.createdAt = moment(task.createdAt).format("LLLL")
                task.edit = false
                return task
            }).filter(task => task.completed === this.showCompleted)
        },
    },
    async mounted() {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        try {
          const response = await fetch("http://localhost:8080/getTasks", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          this.tasks = data;
        } catch (e) {
            console.log(e)
        }
      },
    methods: { 
        async toggleTask(task) {
            task.completed = !task.completed   
            await this.updateTask(task)
        },

        async deleteTask(task) {
            const accessToken = await this.$auth0.getAccessTokenSilently();

            try {
            const response = await fetch("http://localhost:8080/deleteTask", {
                method: "DELETE",
                body: JSON.stringify({
                _id: task._id
                }),
                headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-type": "application/json; charset=UTF-8"
                }
            });
            this.tasks = this.tasks.filter(t => t != task)
            } catch (e) {
                console.log(e)
            }
        },
       async addTask () {

        if (this.newTask.length < 5) {
            this.newTask = "Task should be at least 5 characters long."
            return
        }
        const accessToken = await this.$auth0.getAccessTokenSilently();
            try {
            const response = await fetch("http://localhost:8080/addTask", {
                method: "PUT",
                body: JSON.stringify({
                body: this.newTask
                }),
                headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-type": "application/json; charset=UTF-8"
                }
            });
            const data = await response.json();
            this.tasks.unshift(data)
            this.newTask = ""
            } catch (e) {
                console.log(e)
            }
       },
        async updateTask(task) {
            const accessToken = await this.$auth0.getAccessTokenSilently();
            try {
            await fetch("http://localhost:8080/updateTask", {
                method: "PATCH",
                body: JSON.stringify({
                _id: task._id,
                body: task.body,
                completed: task.completed
                }),
                headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-type": "application/json; charset=UTF-8"
                }
            });
            task.edit = false
            } catch (e) {
                console.log(e)
            }
    }
    }
}
</script>

<template>
<div class="ui text container" v-if="user" >
  <div class="ui segments">
    <div class="ui segment"> 
        <i class="user icon"></i>
        {{user.nickname}}
        <div :title="showCompleted ? 'Hide completed tasks':'Show completed tasks'" class="ui toggle checkbox right floated" @click="showCompleted = !showCompleted">
        <input type="checkbox" name="public">
        <label> Show completed task</label>
        </div>    
    </div>
    <div class="ui clearing segment">
        <div class="ui form">
            <div class="field">
                <label></label>
                <textarea rows="2" data-test-id="task-input" v-model="newTask" placeholder="Add a task ...">
                </textarea>
            </div>
            <button data-test-id="task-submit" title="Add a new task"
            class="ui button icon right floated" @click="addTask" >
            <i class="calendar plus icon"></i></button>
        </div>
    </div>
  </div>
    <div class="ui segments secondary" v-for="tsk in formatedTask">
        <div :class="tsk.completed ? 'completed' : 'notCompleted'" class="ui segment">
        Created on: {{ tsk.createdAt}}
        </div>
        <div class="ui clearing segment">
            <span v-if="!tsk.edit"> 
                <button class="ui icon button right floated" 
                :title="tsk.completed ? 'Mark task as not completed' : 'Mark task as completed'" @click="toggleTask(tsk)">
                <i :class="tsk.completed ? 'redo icon': 'calendar check icon'"></i>
                </button>
                <button class="ui icon button right floated" title="Delete task" @click="deleteTask(tsk)">
                <i class="calendar minus icon"></i>
                </button>

                <button class="ui icon button right floated" title="Edit task" @click="tsk.edit = !tsk.edit">
                <i class="edit icon"></i>
                </button>
                <span style="white-space: pre-line;">{{tsk.body }}</span>
                </span>
            <span v-else>
                <div class="ui form">
                <div class="field">
                    <label></label>
                    <textarea rows="2" v-model="tsk.body">
                    {{tsk.body}}
                    </textarea>
                </div>
                    <button title="Update task"
                    class="ui button icon right floated" @click="updateTask(tsk)" >
                    <i class="sync icon"></i></button>
                </div>
            </span>
        </div>
    </div>
</div>
</template>

<style scoped>
.completed 
{
    background-color: rgb(127, 236, 255);
}
.notCompleted 
{
    background-color: rgb(252, 73, 112);
}
.icon[class*="right floated"], .checkbox[class*="right floated"]{
    float: right !important;
    margin-right: 0em !important;
    margin-left: 1em !important;
}
</style>