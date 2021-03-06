import React from 'react';
import Relay from 'react-relay';
import connectToStores from 'fluxible-addons-react/connectToStores';
import mapProps from 'recompose/mapProps';
import some from 'lodash/some';
import flatten from 'lodash/flatten';
import RoutesRoute from '../../route/RoutesRoute';
import FavouritesTabLabel from './FavouritesTabLabel';

const hasDisruption = routes =>
  some(flatten(routes.map(route => route.alerts.length > 0)));

const alertReducer = mapProps(({ routes, ...rest }) => ({
  hasDisruption: hasDisruption(routes),
  ...rest,
}));

const FavouritesTabLabelRelayConnector = Relay.createContainer(alertReducer(FavouritesTabLabel), {
  fragments: {
    routes: () => Relay.QL`
    fragment on Route @relay(plural:true) {
      alerts {
        id
      }
    }
 `,
  },
});

function FavouritesTabLabelContainer({ routes, ...rest }) {
  if (typeof window !== 'undefined') {
    return (
      <Relay.Renderer
        Container={FavouritesTabLabelRelayConnector}
        queryConfig={new RoutesRoute({ ids: routes })}
        environment={Relay.Store}
        render={({ done, props }) => (done ? (
          <FavouritesTabLabelRelayConnector {...props} {...rest} />
        ) : (
        <FavouritesTabLabel {...rest} />
        ))}
      />);
  }
  return <div />;
}

FavouritesTabLabelContainer.propTypes = {
  routes: React.PropTypes.array.isRequired,
};

export default connectToStores(
  FavouritesTabLabelContainer,
  ['FavouriteRoutesStore'],
  context => ({
    routes: context.getStore('FavouriteRoutesStore').getRoutes(),
  }));
