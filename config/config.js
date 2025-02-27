module.exports = {
  name: 'Intezer',
  acronym: 'IZ',
  description:
    'Search on hashes for File Metadata, TTPs, IOCs, Behavior, and Detect & Hunt data',
  entityTypes: ['SHA256', 'SHA1', 'MD5'],
  defaultColor: 'light-blue',
  onDemandOnly: true,
  styles: ['./client/styles.less'],
  block: {
    component: {
      file: './client/block.js'
    },
    template: {
      file: './client/block.hbs'
    }
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: ''
  },
  logging: {
    level: 'info'
  },
  options: [
    {
      key: 'url',
      name: 'Intezer API URL',
      description:
        'The base URL of the Intezer API including the schema (i.e., https://)',
      default: 'https://analyze.intezer.com',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'Your API Key',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'allowHashScan',
      name: 'Allow Hash Scan',
      description:
        'Enables the ability to scan searched hashes if they have yet to be Analyzed by Intezer',
      default: false,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'autoHashScan',
      name: 'Enable Auto Hash Scan',
      description:
        'Enable the ability to automatically on Search scan hashes if they have yet to be Analyzed by Intezer',
      default: false,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
