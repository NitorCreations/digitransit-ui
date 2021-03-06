function waitForFirstItineraryRow() {
  return this.waitForElementVisible('@firstItinerarySummaryRow',
                          this.api.globals.itinerarySearchTimeout);
}

function waitForItineraryRowOfType(modality) {
  return this.waitForElementVisible(`.line .${modality}:nth-of-type(1)`,
                                    this.api.globals.itinerarySearchTimeout);
}

function waitForItineraryRowOfTypeNotPresent(modality) {
  return this.waitForElementNotPresent(`.line .${modality}:nth-of-type(1)`,
                                       this.api.globals.itinerarySearchTimeout);
}

function chooseFirstItinerarySuggestion() {
  return this.api.checkedClick(this.elements.firstItinerarySummaryRow.selector);
}

function clickSwapOriginDestination() {
  this.waitForElementVisible('@swapDir', this.api.globals.elementVisibleTimeout);
  return this.api.checkedClick(this.elements.swapDir.selector);
}

function clickLater() {
  this.waitForElementVisible('@later', this.api.globals.elementVisibleTimeout);
  return this.api.checkedClick(this.elements.later.selector);
}

module.exports = {
  commands: [{
    waitForFirstItineraryRow,
    waitForItineraryRowOfType,
    waitForItineraryRowOfTypeNotPresent,
    chooseFirstItinerarySuggestion,
    clickSwapOriginDestination,
    clickLater,
  }],
  elements: {
    firstItinerarySummaryRow: '.itinerary-summary-row:nth-of-type(1)',
    swapDir: '.switch',
    later: '.time-navigation-later-btn',
  },
};
