'use strict';
polarity.export = PolarityComponent.extend({
  summary: Ember.computed.alias('block.data.summary'),
  details: Ember.computed.alias('block.data.details'),
  file: Ember.computed.alias('details.file'),
  metadata: Ember.computed.alias('details.metadata'),
  expandableTitleStates: Ember.computed.alias('block._state.expandableTitleStates'),
  getTabResultsIsRunning: Ember.computed.alias('block._state.getTabResultsIsRunning'),
  getTabResultsErrorMessage: Ember.computed.alias(
    'block._state.getTabResultsErrorMessage'
  ),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  scanningFileHash: false,
  scanFileHashErrorMessage: '',
  refreshingFileHashScan: false,
  refreshFileHashScanErrorMessage: '',
  scanStatus: '',
  activeTab: 'file',
  init: function () {
    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.expandableTitleStates', {});
      this.set('block._state.getTabResultsIsRunning', {});
      this.set('block._state.getTabResultsErrorMessage', {});
    }

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
      if (!this.get(tabName)) this.getTabResults(tabName);
    },
    toggleExpandableTitle: function (index) {
      this.set(
        `block._state.expandableTitleStates.${index}`,
        !this.get(`block._state.expandableTitleStates.${index}`)
      );
    },
    scanFileHash: function (endpoint) {
      this.scanFileHash(endpoint);
    },
    refreshFileHashScan: function (endpoint) {
      this.refreshFileHashScan(endpoint);
    }
  },

  scanFileHash: function () {
    this.set('scanningFileHash', true);
    this.set('scanFileHashErrorMessage', '');

    this.sendIntegrationMessage({
      action: 'scanFileHash',
      data: {
        entity: this.get('block.entity')
      }
    })
      .then(({ file, metadata }) => {
        if (file.analysis_id) this.set('summary', ['File Found']);

        if (metadata) this.set('details.metadata', metadata);

        this.set('details.file', file);
      })
      .catch((err) => {
        this.set(
          'scanFileHashErrorMessage',
          `Failed to Scan Hash: ${
            (err &&
              (err.detail || err.message || err.err || err.title || err.description)) ||
            'Unknown Reason'
          }`
        );
      })
      .finally(() => {
        this.set('scanningFileHash', false);

        this.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          if (!this.get('isDestroyed')) {
            this.set('scanFileHashErrorMessage', '');
            this.get('block').notifyPropertyChange('data');
          }
        }, 5000);
      });
  },

  refreshFileHashScan: function () {
    this.set('refreshingFileHashScan', true);
    this.set('refreshFileHashScanErrorMessage', '');

    this.sendIntegrationMessage({
      action: 'refreshFileHashScan',
      data: {
        entity: this.get('block.entity'),
        file: this.get('file')
      }
    })
      .then(({ file, metadata }) => {
        if (file.analysis_id) this.set('summary', ['File Found']);

        if (metadata) this.set('details.metadata', metadata);

        this.set('details.file', file);
      })
      .catch((err) => {
        this.set(
          'refreshFileHashScanErrorMessage',
          `Failed to Refresh Hash Scan: ${
            (err &&
              (err.detail || err.message || err.err || err.title || err.description)) ||
            'Unknown Reason'
          }`
        );
      })
      .finally(() => {
        this.set('refreshingFileHashScan', false);

        this.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          if (!this.get('isDestroyed')) {
            this.set('refreshFileHashScanErrorMessage', '');
            this.get('block').notifyPropertyChange('data');
          }
        }, 5000);
      });
  },
  tabNamesToActions: {
    ttps: 'getFileTtps',
    iocs: 'getFileIocs',
    behavior: 'getFileBehavior',
    detections: 'getFileDetections'
  },
  getTabResults: function (tabName) {
    this.set(`block._state.getTabResultsIsRunning.${tabName}`, true);
    this.set(`block._state.getTabResultsErrorMessage.${tabName}`, '');

    this.sendIntegrationMessage({
      action: this.get('tabNamesToActions')[tabName],
      data: {
        entity: this.get('block.entity'),
        file: this.get('file')
      }
    })
      .then(({ result, summary }) => {
        if (summary) {
          this.set(
            'summary',
            this.get('summary')
              .filter((tag) => tag !== 'File Found')
              .concat(summary)
          );
        }

        this.set(tabName, result);
      })
      .catch((err) => {
        this.set(
          `block._state.getTabResultsErrorMessage.${tabName}`,
          (err &&
            (err.detail || err.message || err.err || err.title || err.description)) ||
            'Unknown Reason'
        );
      })
      .finally(() => {
        this.set(`block._state.getTabResultsIsRunning.${tabName}`, false);
        this.get('block').notifyPropertyChange('data');
      });
  }
});
