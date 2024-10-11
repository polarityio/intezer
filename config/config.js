module.exports = {
  name: 'Intezer',
  acronym: 'NZ',
  description: 'TODO',
  entityTypes: ['hash'],
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
      name: 'Forward Networks API URL',
      description:
        'The base URL of the Forward Networks API including the schema (i.e., https://)',
      default: 'https://fwd.app',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'username',
      name: 'Username',
      description: 'Your Username Credential',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'password',
      name: 'Password',
      description: 'Your Password Credential',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};