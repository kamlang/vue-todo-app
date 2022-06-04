<template>
  <FadeTransition>
    <div class="ui disabled action left icon input" @click.stop="showCalendar = !showCalendar">
      <i class="calendar icon"></i>
      <input
        tabindex="-1"
        :value="formatedDueDate"
        @keydown.delete="unSetDueDate"
        @keydown.esc="showCalendar = false"
        type="text"
        placeholder="Due date..."
      />
      <button v-if="formatedDueDate" @click.stop="unSetDueDate" class="ui icon button">
        <i class="delete icon"></i>
      </button>
    </div>
  </FadeTransition>
  <FadeTransition>
    <div v-if="showCalendar" class="ui segment center aligned calendaritem">
      <i class="icon angle left floated" @click="decMonth"></i>
      <span>{{ getCleanDate(selectedMonth) }}</span>
      <i class="icon angle right right floated" @click="incMonth"></i>
      <table class="ui celled table fixed unstackable">
        <thead>
          <tr>
            <th class="center aligned" v-for="item in computedCalendar.headers">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in computedCalendar.daysGrid">
            <td
              v-for="date in line"
              :data-test-id="date.getDay()"
              :class="[isSelectable(date) ? 'selectable' : 'disabled', isTodayOrDueDate(date) && 'highlighted']"
              v-on="isSelectable(date) ? { click: () => setDueDate(date) } : {}"
              class="center aligned"
            >{{ date.getDate() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </FadeTransition>
</template>


<script>
import Calendar from "../calendar"
import moment from "moment"
import FadeTransition from "./FadeTransition.vue"
export default {
  components: {
    FadeTransition
  },
  emits: ['dueDateSet'],
  data() {
    return {
      calendar: new Calendar(),
      showCalendar: false,
      dueDate: Date
    }
  },
  props: {
    injectedDueDate: String
  },
  methods: {
    setDueDate(selectedDate) {
      this.dueDate = selectedDate
      this.$emit('dueDateSet', this.dueDate.toString())
      this.showCalendar = false
    },
    unSetDueDate() {
      this.dueDate = ""
      this.$emit('dueDateSet', '')
    },
    getCleanDate(date) {
      return moment(date).format("MMMM YY")
    },

    isTodayOrDueDate(date) {
      let today = new Date()
      return this.dueDate instanceof Date ?
        this.calendar.isSameDay(this.dueDate, date) :
        this.calendar.isSameDay(today, date)
    },
    isSelectable(date) {
      let today = new Date()
      return (this.calendar.isSameDay(today, date) ||
        today.getTime() <= date.getTime()) &&
        date.getMonth() === this.selectedMonth.getMonth() ?
        true : false
    },

    incMonth() {
      this.calendar.incMonth()
    },
    decMonth() {
      this.calendar.decMonth()
    },
  },
  computed: {
    formatedDueDate() {
      if (this.injectedDueDate) {
        this.dueDate = new Date(this.injectedDueDate)
        return moment(this.dueDate).format("LL")
      } else {
        return ""
      }
    },
    selectedMonth() {
      return this.calendar.getDate()
    },
    computedCalendar() {
      this.calendar.create()
      return { headers: this.calendar.headers, daysGrid: this.calendar.daysGrid }
    }
  }
}
</script>
<style scoped>
.calendaritem {
  position: absolute !important;
  max-width: 300px;
  z-index: 2;
}

.icon[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
.icon[class*="left floated"] {
  float: left !important;
  margin-left: 0em !important;
  margin-right: 1em !important;
}
.highlighted {
  background-color: rgb(252, 73, 112);
}
td.disabled {
  color: #aaa;
}

.calendaritem table td,
th {
  padding: 0.271429em 0.271429em !important;
}
</style>