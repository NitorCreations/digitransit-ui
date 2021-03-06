import React from 'react';
import Icon from '../../icon/Icon';
import ComponentUsageExample from '../../documentation/ComponentUsageExample';

function SelectCityBikeRow(props) {
  return (
    <div className="no-margin">
      <div className="cursor-pointer" onClick={props.selectRow}>
        <div className="left padding-vertical-small select-row-icon">
          <Icon img="icon-icon_citybike" />
        </div>
        <div className="left padding-vertical-normal select-row-text">
          <span className="header-primary no-margin link-color">{props.name} ›</span>
        </div>
        <div className="clear" />
      </div>
      <hr className="no-margin gray" />
    </div>
  );
}

SelectCityBikeRow.displayName = 'SelectCityBikeRow';

SelectCityBikeRow.description = (
  <div>
    <p>Renders a select citybike row</p>
    <ComponentUsageExample description="">
      <SelectCityBikeRow name={'LINNANMÄKI'} selectRow={() => {}} />
    </ComponentUsageExample>
  </div>
  );

SelectCityBikeRow.propTypes = {
  selectRow: React.PropTypes.func.isRequired,
  name: React.PropTypes.string.isRequired,
};

export default SelectCityBikeRow;
