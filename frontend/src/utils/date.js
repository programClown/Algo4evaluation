import dayjs from 'dayjs'

/**
 * convert seconds number to human-readable string
 * @param {number} duration duration in seconds
 * @return {string}
 */
export const toHumanReadable = (duration) => {
    const dur = dayjs.duration(duration, 'seconds')
    const days = Math.floor(dur.asDays())
    if (days > 0) {
        return days + '天 ' + dur.format('HH:mm:ss')
    } else {
        return dur.format('HH:mm:ss')
    }
}
