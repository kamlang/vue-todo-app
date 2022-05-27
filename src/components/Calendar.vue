<template>
  <div class="ui segment center aligned calendar">
    <i class="icon angle left floated" @click="decMonth"></i>
    <span>{{ getCleanDate(selectedMonth) }}</span>
    <i class="icon angle right right floated" @click="incMonth"></i>
    <table class="ui fourteen wide celled table unstackable">
      <thead>
        <tr>
          <th class="two wide center aligned" v-for="item in computedCalendar.headers">{{ item }}</th>
        </tr>
      </thead>
      <tbody>
        <tr class="center aligned" v-for="line in computedCalendar.daysGrid">
          <td
            v-for="date in line"
            :class="[isSelectable(date) ? 'selectable' : 'disabled', isTodayOrDueDate(date) && 'highlighted']"
            v-on="isSelectable(date) ? { click: () => clickHandler(date) } : {}"
            class="two wide"
          >{{ date.getDate() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script>
import Calendar from "../calendar"
import moment from "moment"
export default {
  emit: ['dateSet', 'unSerDate'],
  data() {
    return {
      calendar: new Calendar(),
    }
  },
  props: {
    dueDate: Date
  },

  methods: {
    clickHandler(selectedDate) {
      if (this.dueDate instanceof Date && this.calendar.isSameDay(selectedDate, this.dueDate)) this.$emit('unSetDate')
      else this.$emit('setDate', selectedDate)
    },
    getCleanDate(day) {
      return moment(day).format("MMMM YY")
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
.calendar {
  position: absolute !important;
  min-width: 250px !important;
  z-index: 2;
}
.highlighted {
  background-color: rgb(252, 73, 112);
}
td.disabled {
  color: #aaa;
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
</style>