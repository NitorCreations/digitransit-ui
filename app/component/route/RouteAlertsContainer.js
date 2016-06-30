import React from 'react';
import Relay from 'react-relay';
import { FormattedMessage, intlShape } from 'react-intl';
import moment from 'moment';
import find from 'lodash/find';
import connectToStores from 'fluxible-addons-react/connectToStores';

import RouteAlertsRow from './RouteAlertsRow';


const getAlerts = (route, currentTime, intl) => {
  const routeMode = route.type.toLowerCase();
  const routeLine = route.shortName;

  return route.alerts.map(alert => {
    // Try to find the alert in user's language, or failing in English, or failing in any language
    // TODO: This should be a util function that we use everywhere
    // TODO: We should match to all languages user's browser lists as acceptable
    let header = find(alert.alertHeaderTextTranslations,
                      ['language', intl.locale]);
    if (!header) {
      header = find(alert.alertHeaderTextTranslations,
                    ['language', 'en']);
    }
    if (!header) {
      header = alert.alertHeaderTextTranslations[0];
    }
    if (header) {
      header = header.text;
    }

    // Unfortunately nothing in GTFS-RT specifies that if there's one string in a language then
    // all other strings would also be available in the same language...
    let description = find(alert.alertDescriptionTextTranslations,
                      ['language', intl.locale]);
    if (!description) {
      description = find(alert.alertDescriptionTextTranslations,
                    ['language', 'en']);
    }
    if (!description) {
      description = alert.alertDescriptionTextTranslations[0];
    }
    if (description) {
      description = description.text;
    }

    let endTime = moment(alert.effectiveEndDate * 1000);
    let day;
    switch (currentTime.diff(endTime, 'days')) {
      case 0:
        day = <FormattedMessage id="today" defaultMessage="Today" />;
        break;
      case 1:
        day = <FormattedMessage id="yesterday" defaultMessage="Yesterday" />;
        break;
      default:
        day = intl.formatDate(endTime);
    }
    endTime = intl.formatTime(endTime);
    const startTime = intl.formatTime(moment(alert.effectiveStartDate * 1000));
    const expired = endTime < currentTime;


    return (
      <RouteAlertsRow
        key={alert.id}
        {...{
          routeMode,
          routeLine,
          header,
          description,
          day,
          endTime,
          startTime,
          expired,
        }}
      />);
  });
};

function RouteAlertsContainer({ route, currentTime }, { intl }) {
  if (route.alerts.length === 0) {
    return (
      <div className="no-alerts-message">
        <FormattedMessage
          id="disruption-info-no-alerts"
          defaultMessage="No disruption info."
        />
      </div>);
  }

  return (
    <div className="route-alerts-list momentum-scroll">
      {getAlerts(route, currentTime, intl)}
    </div>);
}

RouteAlertsContainer.propTypes = {
  route: React.PropTypes.object.isRequired,
  currentTime: React.PropTypes.object,
};

RouteAlertsContainer.contextTypes = {
  intl: intlShape,
};

const RouteAlertsContainerWithTime = connectToStores(
  RouteAlertsContainer,
  ['TimeStore'],
  context => ({
    currentTime: context.getStore('TimeStore').getCurrentTime(),
  })
);


export default Relay.createContainer(RouteAlertsContainerWithTime,
  {
    fragments: {
      route: () => Relay.QL`
        fragment on Route {
          type
          shortName
          alerts {
            id
            alertHeaderTextTranslations {
              text
              language
            }
            alertDescriptionTextTranslations {
              text
              language
            }
            effectiveStartDate
            effectiveEndDate
          }
        }
      `,
    },
  }
);
