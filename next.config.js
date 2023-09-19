/* eslint-disable no-param-reassign */
const fs = require('fs');
const path = require('path');
const util = require('util');

const withPlugins = require('next-compose-plugins');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const webpackConfigPlugins = require('./config/webpack/configPlugins');
const webpackConfigRules = require('./config/webpack/configRules');
const webpackConfigSourcemaps = require('./config/webpack/configSourcemaps');

const { AccountId } = require('./src/utils/deploymentInfo');

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';


// fix antd bug in dev development
const devAntd = '@import "~antd/dist/antd.less";\n';
const stylesData = fs.readFileSync(
  path.resolve(__dirname, './assets/_styles.less'),
  'utf-8',
);
fs.writeFileSync(
  path.resolve(__dirname, './assets/self-styles.less'),
  isDev ? `${devAntd}${stylesData}` : stylesData,
  'utf-8',
);

// fix: prevents error when .css files are required by node
if (typeof require !== 'undefined') {
  require.extensions['.less'] = () => { };
}

const nextConfig = {
  // Redirects enforced by Next.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/data-management',
        permanent: false,
      },
      {
        source: '/experiments',
        destination: '/data-management',
        permanent: false,
      },
      {
        source: '/experiments/:experimentId',
        destination: '/experiments/:experimentId/data-exploration',
        permanent: false,
      },
    ];
  },
  experimental: {
    productionBrowserSourceMaps: true,
  },
  webpack: (config, params) => {
    const { dev } = params;

    // bn.js occurs a lot in various crypto libraries we have polyfills for
    // this is a fix that makes sure all versions of bn.js point to the same
    // version that we install directly, reducing the bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      'bn.js': path.join(__dirname, 'node_modules/bn.js/lib/bn.js'),
    };

    const final = webpackConfigSourcemaps(
      webpackConfigRules(
        webpackConfigPlugins(
          config,
          params,
        ), params,
      ), params,
    );

    if (!dev) {
      console.log('WebPack build configuration:');
      console.log(util.inspect(config, false, null, true /* enable colors */));
    }

    return final;
  },
  images: {
    disableStaticImages: true,
  },
};

let accountId = process.env.AWS_ACCOUNT_ID;
if (isDev) {
  if (process.env.DEV_ACCOUNT === undefined) {
    throw new Error(
      `In local environment, DEV_ACCOUNT is expected to be set, possible values are: ${Object.keys(AccountId)} or "other" for other aws accounts`,
    );
  }

  accountId = AccountId[process.env.DEV_ACCOUNT];
}

module.exports = withPlugins([
  [withBundleAnalyzer],
  {
    publicRuntimeConfig: {
      domainName: process.env.DOMAIN_NAME,
      accountId,
    },
  },
], nextConfig);
