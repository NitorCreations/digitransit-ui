import React, { PropTypes } from 'react';
import cx from 'classnames';
import Link from 'react-router/lib/Link';
import { FormattedMessage, intlShape } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';
import isEmpty from 'lodash/isEmpty';
import isNumber from 'lodash/isNumber';
import Icon from '../icon/Icon';
import FavouriteIconTable from './FavouriteIconTable';
import { addFavouriteLocation, deleteFavouriteLocation } from '../../action/FavouriteActions';
import FakeSearchBar from '../search/FakeSearchBar';
import OneTabSearchModal from '../search/OneTabSearchModal';

class AddFavouriteContainer extends React.Component {
  static contextTypes = {
    intl: intlShape.isRequired,
    executeAction: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
  };

  static propTypes = {
    favourite: PropTypes.object, // if specified edit mode is activated
  }

  componentWillMount = () => {
    if (this.isEdit()) {
      this.setState({ favourite: this.props.favourite, searchModalIsOpen: false });
    } else {
      this.setState({ favourite: {
        selectedIconId: undefined,
        lat: undefined,
        lon: undefined,
        locationName: undefined,
        address: undefined,
        version: 1,
      },
        searchModalIsOpen: false });
    }
  }

  getFavouriteIconIds = () =>
    (['icon-icon_place', 'icon-icon_home', 'icon-icon_work', 'icon-icon_sport',
      'icon-icon_school', 'icon-icon_shopping']);

  setCoordinatesAndAddress = (name, location) => (
    this.setState({ favourite: { ...this.state.favourite,
      lat: location.geometry.coordinates[1],
      lon: location.geometry.coordinates[0],
      address: name,
    } }));

  isEdit = () => this.props.favourite !== undefined && this.props.favourite.id !== undefined;

  canSave = () => (
    !isEmpty(this.state.favourite.selectedIconId) &&
    isNumber(this.state.favourite.lat) &&
    isNumber(this.state.favourite.lon) &&
    !isEmpty(this.state.favourite.locationName)
  );

  save = () => {
    if (this.canSave()) {
      this.context.executeAction(addFavouriteLocation, this.state.favourite);
      this.quit();
    }
  }

  delete = () => {
    this.context.executeAction(deleteFavouriteLocation, this.state.favourite);
    this.quit();
  }

  quit = () => {
    this.context.router.replace('/suosikit');
  }

  specifyName = (event) => {
    this.setState({ favourite: { ...this.state.favourite, locationName: event.target.value } });
  }

  selectIcon = (id) => {
    this.setState({ favourite: { ...this.state.favourite, selectedIconId: id } });
  };

  closeSearchModal = () => {
    this.setState({
      searchModalIsOpen: false,
    });
  }

  render() {
    const destinationPlaceholder = this.context.intl.formatMessage({
      id: 'address',
      defaultMessage: 'Address',
    });

    const searchTabLabel = this.context.intl.formatMessage({
      id: 'favourite-target',
      defaultMessage: 'Favourite place',
    });

    const favourite = this.state.favourite;

    return (<div className="fullscreen">
      <div className="add-favourite-container">
        <Link to="/suosikit" className="right cursor-pointer">
          <Icon id="add-favourite-close-icon" img="icon-icon_close" />
        </Link>
        <row>
          <div className="add-favourite-container__content small-12 small-centered columns">
            <header className="add-favourite-container__header row">
              <div className="cursor-pointer add-favourite-star small-1 columns">
                <Icon className={cx('add-favourite-star__icon', 'selected')} img="icon-icon_star" />
              </div>
              <div className="add-favourite-container__header-text small-11 columns">
                <h3>{(!this.isEdit() &&
                  <FormattedMessage
                    id="add-location-to-favourites"
                    defaultMessage="Add a location to your favourites tab"
                  />) || <FormattedMessage
                    id="edit-favourites"
                    defaultMessage="Edit favourite place"
                  />}
                </h3>
              </div>
            </header>
            <div className="add-favourite-container__search search-form">
              <h4>
                <FormattedMessage id="specify-location" defaultMessage="Specify the location" />
              </h4>
              <FakeSearchBar
                endpointAddress={(this.state != null ? favourite.address : undefined) || ''}
                placeholder={destinationPlaceholder}
                onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    searchModalIsOpen: true,
                  });
                }} id="destination" className="add-favourite-container__input-placeholder"
              />
            </div><div className="add-favourite-container__give-name">
              <h4>
                <FormattedMessage id="give-name-to-location" defaultMessage="Name the location" />
              </h4>
              <div className="add-favourite-container__input-placeholder">
                <input
                  className="add-favourite-container__input"
                  value={favourite.locationName}
                  placeholder={this.context.intl.formatMessage({
                    id: 'location-examples',
                    defaultMessage: 'e.g. Home, Work, Scool,...',
                  })} onChange={this.specifyName}
                />
              </div>
            </div>
            <div className="add-favourite-container__pick-icon">
              <h4><FormattedMessage id="pick-icon" defaultMessage="Select an icon" /></h4>
              <FavouriteIconTable
                selectedIconId={(() => {
                  if (favourite.selectedIconId !== 'undefined' || null) {
                    return favourite.selectedIconId;
                  }
                  return undefined;
                })()} favouriteIconIds={this.getFavouriteIconIds()} handleClick={this.selectIcon}
              />
            </div>
            <div className="add-favourite-container__save">
              <div
                className={`add-favourite-container-button ${this.canSave() ? '' : 'disabled'}`}
                onClick={this.save}
              >
                <FormattedMessage
                  id="save" defaultMessage="Save"
                />
              </div>
            </div>
            {this.isEdit() &&
              [(<div key="delete" className="add-favourite-container__save">
                <div
                  className="add-favourite-container-button delete" onClick={this.delete}
                >
                  <FormattedMessage
                    id="delete" defaultMessage="Delete"
                  />
                </div>
              </div>), (<div key="cancel" className="add-favourite-container__save">
                <div
                  className="add-favourite-container-button cancel" onClick={this.quit}
                >
                  <FormattedMessage
                    id="cancel" defaultMessage="Cancel"
                  />
                </div>
              </div>)]
            }
          </div>
        </row>
      </div>
      <OneTabSearchModal
        modalIsOpen={this.state.searchModalIsOpen}
        closeModal={this.closeSearchModal}
        customTabLabel={searchTabLabel}
        initialValue=""
        customOnSuggestionSelected={(name, item) => {
          this.setCoordinatesAndAddress(name, item);
          return this.closeSearchModal();
        }}
      /></div>);
  }
}

const AddFavouriteContainerWithFavourite = connectToStores(AddFavouriteContainer,
  ['FavouriteLocationStore'],
  (context, props) => (
    { favourite:
      props.params.id !== undefined ? context.getStore('FavouriteLocationStore')
        .getById(parseInt(props.params.id, 10)) : {},
    }
  )
);

export default AddFavouriteContainerWithFavourite;
