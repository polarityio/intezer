'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  file: Ember.computed.alias('details.file'),
  metadata: Ember.computed.alias('details.metadata'),
  ttps: Ember.computed.alias('details.ttps'),
  iocs: Ember.computed.alias('details.iocs'),
  behavior: Ember.computed.alias('details.behavior'),
  detections: Ember.computed.alias('details.detections'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  activeTab: 'geneticAnalysis',
  expandableTitleStates: {},
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
    },
    toggleExpandableTitle: function (index) {
      this.set(
        `expandableTitleStates`,
        Object.assign({}, this.get("expandableTitleStates"), {
          [index]: !this.get("expandableTitleStates")[index],
        })
      );

      this.get("block").notifyPropertyChange("data");
    },
    
  }
});
