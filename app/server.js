// React
import React from 'react';
import ReactDOM from 'react-dom/server';

// Routing and state handling
import match from 'react-router/lib/match';
import Helmet from 'react-helmet';
import createHistory from 'react-router/lib/createMemoryHistory';
import Relay from 'react-relay';
import IsomorphicRouter from 'isomorphic-relay-router';
import FluxibleComponent from 'fluxible-addons-react/FluxibleComponent';

// Libraries
import serialize from 'serialize-javascript';
import { IntlProvider } from 'react-intl';
import polyfillService from 'polyfill-service';
import fs from 'fs';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

// Application
import application from './app';
import config from './config';
import translations from './translations';
import ApplicationHtml from './html';

const port = process.env.HOT_LOAD_PORT || 9000;

// Disable relay query cache in order tonot leak memory, see facebook/relay#754
Relay.disableQueryCaching();

function getStringOrArrayElement(arrayOrString, index) {
  if (Array.isArray(arrayOrString)) {
    return arrayOrString[index];
  } else if (typeof arrayOrString === 'string') {
    return arrayOrString;
  }
  throw new Error(`Not array or string: ${arrayOrString}`);
}

// Look up paths for various asset files
const appRoot = `${process.cwd()}/`;

const svgSprite = fs.readFileSync(`${appRoot}static/svg-sprite.${config.CONFIG}.svg`).toString();
const geolocationStarter = fs.readFileSync(`${appRoot}static/geolocation.js`).toString();

const networkLayer = new Relay.DefaultNetworkLayer(`${config.URL.OTP}index/graphql`);

let stats;
let manifest;
let css;

if (process.env.NODE_ENV !== 'development') {
  stats = require('../stats.json'); // eslint-disable-line global-require, import/no-unresolved

  const manifestFile = getStringOrArrayElement(stats.assetsByChunkName.manifest, 0);
  manifest = fs.readFileSync(`${appRoot}_static/${manifestFile}`);
  css = [
    <link
      rel="stylesheet"
      type="text/css"
      href={`${config.APP_PATH}/${getStringOrArrayElement(stats.assetsByChunkName.main, 1)}`}
    />,
    <link
      rel="stylesheet"
      type="text/css"
      href={`${config.APP_PATH}/${
        getStringOrArrayElement(stats.assetsByChunkName[`${config.CONFIG}_theme`], 1)
      }`}
    />,
  ];
}

function getPolyfills(userAgent) {
  // Do not trust Samsung, LG
  // see https://digitransit.atlassian.net/browse/DT-360
  // https://digitransit.atlassian.net/browse/DT-445
  // Also https://github.com/Financial-Times/polyfill-service/issues/727
  if (!userAgent ||
    /(IEMobile|LG-|GT-|SM-|SamsungBrowser|Google Page Speed Insights)/.test(userAgent)
  ) {
    userAgent = ''; // eslint-disable-line no-param-reassign
  }

  const features = {
    'Array.prototype.includes': { flags: ['gated'] },
    default: { flags: ['gated'] },
    es5: { flags: ['gated'] },
    es6: { flags: ['gated'] },
    fetch: { flags: ['gated'] },
    Intl: { flags: ['gated'] },
    matchMedia: { flags: ['gated'] },
    setImmediate: { flags: ['gated'] },
    Symbol: { flags: ['gated'] },
    'Symbol.iterator': { flags: ['gated'] },
  };

  for (const language of config.availableLanguages) {
    features[`Intl.~locale.${language}`] = {
      flags: ['gated'],
    };
  }

  return polyfillService.getPolyfillString({
    uaString: userAgent,
    features,
    minify: true,
    unknown: 'polyfill',
    // TODO WeakMap polyfill breaks IE11 on load, bug in polyfill-service
    excludes: ['WeakMap'],
  });
}

function getScripts(req) {
  if (process.env.NODE_ENV === 'development') {
    const host =
      (req.headers.host && req.headers.host.split(':')[0]) || 'localhost';

    return <script async src={`//${host}:${port}/js/bundle.js`} />;
  }
  return [
    <script dangerouslySetInnerHTML={{ __html: manifest }} />,
    <script
      src={`${config.APP_PATH}/${getStringOrArrayElement(stats.assetsByChunkName.common, 0)}`}
    />,
    <script
      src={`${config.APP_PATH}/${getStringOrArrayElement(stats.assetsByChunkName.leaflet, 0)}`}
    />,
    <script
      src={`${config.APP_PATH}/${getStringOrArrayElement(stats.assetsByChunkName.main, 0)}`}
    />,
  ];
}

function getContent(context, renderProps, locale, userAgent) {
  // TODO: This should be moved to a place to coexist with similar content from client.js
  return ReactDOM.renderToString(
    <FluxibleComponent context={context.getComponentContext()}>
      <IntlProvider locale={locale} messages={translations[locale]}>
        <MuiThemeProvider muiTheme={getMuiTheme({}, { userAgent })}>
          {IsomorphicRouter.render(renderProps)}
        </MuiThemeProvider>
      </IntlProvider>
    </FluxibleComponent>
  );
}

function getHtml(context, locale, [polyfills, relayData], req) {
  // eslint-disable-next-line no-unused-vars
  const content = getContent(context, relayData.props, locale, req.headers['user-agent']);
  const head = Helmet.rewind();

  return ReactDOM.renderToStaticMarkup(
    <ApplicationHtml
      css={process.env.NODE_ENV === 'development' ? false : css}
      svgSprite={svgSprite}
      content=""
      // TODO: temporarely disable server-side rendering in order to fix issue with having different
      // content from the server, which breaks leaflet integration. Should be:
      // content={content}
      polyfill={polyfills}
      state={`window.state=${serialize(application.dehydrate(context))};`}
      locale={locale} scripts={getScripts(req)}
      fonts={config.URL.FONT}
      config={`window.config=${JSON.stringify(config)}`}
      geolocationStarter={geolocationStarter}
      relayData={relayData.data}
      head={head}
    />
  );
}

export default function (req, res, next) {
   // 1. use locale from cookie (user selected) 2. browser preferred 3. default
  let locale = req.cookies.lang ||
    req.acceptsLanguages(config.availableLanguages);

  if (config.availableLanguages.indexOf(locale) === -1) {
    locale = config.defaultLanguage;
  }

  if (req.cookies.lang === undefined || req.cookies.lang !== locale) {
    res.cookie('lang', locale);
  }

  const context = application.createContext();

  // required by material-ui
  global.navigator = { userAgent: req.headers['user-agent'] };

  const location = createHistory({ basename: config.APP_PATH }).createLocation(req.url);

  match({
    routes: context.getComponent(),
    location,
  }, (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(301, redirectLocation.pathname + redirectLocation.search);
    } else if (error) {
      next(error);
    } else if (!renderProps) {
      res.status(404).send('Not found');
    } else {
      const promises = [
        getPolyfills(req.headers['user-agent']),
        IsomorphicRouter.prepareData(renderProps, networkLayer),
      ];

      if (renderProps.routes[1] && renderProps.routes[1].loadAction) {
        renderProps.routes[1]
          .loadAction(renderProps.params)
          .forEach(action => promises.push(context.executeAction(action[0], action[1])));
      }

      Promise.all(promises).then(results =>
        res.send(`<!doctype html>${getHtml(context, locale, results, req)}`)
      ).catch((err) => {
        if (err) { next(err); }
      });
    }
  });
}
