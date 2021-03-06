import React from 'react';
import cx from 'classnames';

import Icon from '../icon/Icon';

function WalkDistance(props) {
  const roundedWalkDistanceInM = Math.round(props.walkDistance / 100) * 100;
  const roundedWalkDistanceInKm = (roundedWalkDistanceInM / 1000).toFixed(1);

  const walkDistance = roundedWalkDistanceInM < 1000 ?
    `${roundedWalkDistanceInM}m` : `${roundedWalkDistanceInKm}km`;

  const icon = `icon-${props.icon || 'icon_walk'}`;

  return (
    <span className={cx(props.className)} style={{ whiteSpace: 'nowrap' }}>
      <Icon img={icon} />
      <span className="walk-distance">
        &nbsp;{walkDistance}
      </span>
    </span>
  );
}

WalkDistance.description =
  'Displays the total walk distance of the itinerary in precision of 10 meters. ' +
  'Requires walkDistance in meters as props. Displays distance in km if distance is 1000 or above';

WalkDistance.propTypes = {
  walkDistance: React.PropTypes.number.isRequired,
  icon: React.PropTypes.string,
  className: React.PropTypes.string,
};

WalkDistance.displayName = 'WalkDistance';
export default WalkDistance;
