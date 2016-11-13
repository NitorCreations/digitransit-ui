import moment from 'moment-timezone/moment-timezone';

import config from '../config';

// Configure moment with the selected language
// and with the relative time thresholds used when humanizing times
function configureMoment(language) {
  moment.locale(language);

  if (config.timezoneData) {
    moment.tz.add(config.timezoneData);
    moment.tz.setDefault(config.timezoneData.split('|')[0]);
  }

  if (language !== 'en') {
    // eslint-disable-next-line global-require, prefer-template, import/no-dynamic-require
    require('moment/src/locale/' + language);
  }

  moment.relativeTimeThreshold('s', config.moment.relativeTimeThreshold.seconds);
  moment.relativeTimeThreshold('m', config.moment.relativeTimeThreshold.minutes);
  moment.relativeTimeThreshold('h', config.moment.relativeTimeThreshold.hours);
  moment.relativeTimeThreshold('d', config.moment.relativeTimeThreshold.days);
  moment.relativeTimeThreshold('M', config.moment.relativeTimeThreshold.months);
  return moment;
}

module.exports = configureMoment;
