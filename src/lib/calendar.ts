/*
Return a representation of the current Month.
Each day is returned as an instance of Date.

exampleResult = [
  ["T", "W", "T", "F", "S", "S", "M"],
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, 1, 2, 3, 4],
]
*/
class Calendar {

  DAYS_INITIALS: string[] = ["S", "M", "T", "W", "T", "F", "S"]
  NUMBER_OF_DAYS_RETURNED = 35
  _date: Date

  constructor(date = new Date()) {
    this._date = date
  }

  getCurrentDate(): Date {
    return this._date
  }

  getCalendar(): Array<Array<string | Date>> {
    let daysOfMonthPerWeek = this._getDaysOfMonthPerWeek()
    let orderedDayInitial: string[] = this._getOrderedDayInitial(daysOfMonthPerWeek)
    let calendar: Array<Array<string | Date>> = []

    calendar.push(orderedDayInitial)
    daysOfMonthPerWeek.forEach(week => {
      calendar.push(week)
    })
    return calendar
  }

  _getOrderedDayInitial(daysInMonthPerWeek: Array<Array<Date>>): string[] {
    let orderedDayInitial: string[] = []
    let [firstWeek] = daysInMonthPerWeek

    for (let day of firstWeek) {
      let dayNumber = day.getDay()
      orderedDayInitial.push(
        this.DAYS_INITIALS[dayNumber]
      )
    }
    return orderedDayInitial
  }

  _getDaysOfMonthPerWeek(): Array<Array<Date>> {
    let currentYear = this._date.getFullYear()
    let currentMonth = this._date.getMonth()
    let daysInMonthPerWeek: Array<Array<Date>> = []
    let daysInWeek: Date[] = []

    for (let day = 1; day <= this.NUMBER_OF_DAYS_RETURNED; day++) {
      let currentDate: Date = new Date(currentYear, currentMonth, day)
      let isFirstDayOfAWeek = day % 7 === 0

      daysInWeek.push(currentDate)
      if (isFirstDayOfAWeek) {
        daysInMonthPerWeek.push(daysInWeek)
        daysInWeek = []
      }
    }
    return daysInMonthPerWeek
  }

  increaseMonth(): void {
    this._date = new Date(
      this._date.setMonth(this._date.getMonth() + 1))
  }

  decreaseMonth(): void {
    this._date = new Date(
      this._date.setMonth(this._date.getMonth() - 1))
  }
}
export default Calendar