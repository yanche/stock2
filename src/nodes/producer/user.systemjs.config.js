
(function (global) {
  System.config({
    map: {
      // our app is within the app folder
      app: 'site/user',
      common: 'site/common',

      // angular bundles
      '@angular/core': 'libs/js/@angular/core.umd.min.js',
      '@angular/common': 'libs/js/@angular/common.umd.min.js',
      '@angular/compiler': 'libs/js/@angular/compiler.umd.min.js',
      '@angular/platform-browser': 'libs/js/@angular/platform-browser.umd.min.js',
      '@angular/platform-browser-dynamic': 'libs/js/@angular/platform-browser-dynamic.umd.min.js',
      '@angular/http': 'libs/js/@angular/http.umd.min.js',
      '@angular/router': 'libs/js/@angular/router.umd.min.js',
      '@angular/forms': 'libs/js/@angular/forms.umd.min.js',

      // other libraries
      'rxjs': 'libs/js/rxjs'
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        main: './main.js',
        defaultExtension: 'js'
      },
      common: {
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      }
    }
  });
})(this);
