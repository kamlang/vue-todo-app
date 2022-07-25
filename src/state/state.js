import { reactive } from 'vue'

export const store = reactive({
  projects: [],
  selectedProject: null,
  selectedTask: null,
  errorMessage: null,
  notifications: new Set(),

  setProjects(data) {
    this.projects = data
    const firstProjectIndex = 0
    this.setSelectedProject(firstProjectIndex)
  },

  addProject(data) {
    this.projects.push(data)
    const newlyCreatedProjectIndex = this.projects.length - 1
    this.setSelectedProject(newlyCreatedProjectIndex)
  },

  setSelectedProject(index) {
    this.selectedProject = this.projects[index]
  },

  setSelectedTask(index) {
    if (index === -1) {
      this.selectedTask = null
    } else {
      this.selectedTask = this.selectedProject.tasks[index]
    }
  },

  reOrderProjects(oldIndex, newIndex) {
    this._reOrderArray(this.projects, oldIndex, newIndex)
  },

  reOrderSelectedProject(oldIndex, newIndex) {
    this._reOrderArray(this.selectedProject.tasks, oldIndex, newIndex)
  },

  _reOrderArray(array, oldIndex, newIndex) {
    let itemToMove = array[oldIndex]
    array.splice(oldIndex, 1)
    array.splice(newIndex, 0, itemToMove)
  },

  changeProjectName(oldName, newName) {
    for (let project of this.projects) {
      if (project.name === oldName) {
        project.name = newName
      }
    }
  },

  updateTask(data, index) {
    if (!index) {
      index = this.selectedProject.tasks.findIndex(task => task._id === data._id)
    }
    this.selectedProject.tasks[index] = data
  },

  addTaskToSelectedProject(data) {
    this.selectedProject.tasks.unshift(data)
  },

  deleteProject(projectToDelete) {
    this.projects = this.projects
      .filter(project => project._id !== projectToDelete._id)
    this.selectedProject = this.projects[0]
  },

  deleteTask(taskToDelete) {
    this.selectedProject.tasks = this.selectedProject.tasks
      .filter(task => task._id !== taskToDelete._id)
  },

  populateNotifications() {
    if (!this.projects) return
    for (let project of this.projects) {
      for (let task of project.tasks) {
        if (task.dueDate !== null && task.completed === false) {
          const taskDueDate = new Date(task.dueDate)
          if (taskDueDate < Date.now()) {
            /* Adding project name to the task object so we can reference it 
            in the notification message */
            task.projectName = project.name
            this.notifications.add(task)
          }
        }
      }
    }
  },

  deleteNotification(task) {
    this.notifications.delete(task)
  }
})