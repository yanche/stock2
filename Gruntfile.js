﻿
const angularLibs = ['common', 'compiler', 'core', 'forms', 'http', 'platform-browser', 'platform-browser-dynamic', 'router'];
const libCopyList = angularLibs.map(name => {
    return {
        src: `node_modules/@angular/${name}/bundles/${name}.umd.min.js`,
        dest: `static/libs/js/@angular/${name}.umd.min.js`
    };
}).concat([{
    src: 'node_modules/zone.js/dist/zone.min.js',
    dest: 'static/libs/js/zone.min.js'
// }, {
//     src: 'node_modules/rxjs/bundles/Rx.min.js',
//     dest: 'static/libs/js/Rx.min.js'
}, {
    src: 'node_modules/reflect-metadata/Reflect.js',
    dest: 'static/libs/js/Reflect.js'
}, {
    expand: true,
    cwd: 'node_modules/rxjs',
    src: ['**/*.js'],
    dest: 'static/libs/js/rxjs',
    filter: 'isFile'
}, {
    src: 'node_modules/systemjs/dist/system.src.js',
    dest: 'static/libs/js/system.src.js'
}, {
    src: 'bower_components/font-awesome/css/font-awesome.min.css',
    dest: 'static/libs/css/font-awesome.min.css'
}, {
    src: 'node_modules/moment/moment.js',
    dest: 'static/libs/js/moment.js'
}, {
    expand: true,
    cwd: 'bower_components/font-awesome/fonts',
    src: ['**'],
    dest: 'static/libs/fonts',
    filter: 'isFile'
}]);

module.exports = function (grunt) {
    grunt.initConfig({
        srcpath: 'src/nodes/producer',
        exec: {
            jadeCompile: {
                cmd: 'node <%= srcpath %>/jadecompile.js',
            },
            jadeCompileDev: {
                cmd: 'node <%= srcpath %>/jadecompile.js -d',
            }
        },
        copy: {
            indexHtml: {
                files: [{
                    expand: true,
                    src: ['admin.html', 'user.html'],
                    dest: 'static',
                    cwd: '<%= srcpath %>'
                }]
            },
            jsAdmin: {
                files: [{
                    expand: true,
                    cwd: '<%= srcpath %>/site/admin',
                    src: ['**/*.js', '**/*.html', '**/*.css'],
                    dest: 'static/site/admin',
                    filter: 'isFile'
                }, {
                    src: '<%= srcpath %>/admin.systemjs.config.js',
                    dest: 'static/admin.systemjs.config.js'
                }]
            },
            jsUser: {
                files: [{
                    expand: true,
                    cwd: '<%= srcpath %>/site/user',
                    src: ['**/*.js', '**/*.html', '**/*.css'],
                    dest: 'static/site/user',
                    filter: 'isFile'
                }, {
                    src: '<%= srcpath %>/user.systemjs.config.js',
                    dest: 'static/user.systemjs.config.js'
                }]
            },
            jsCommon: {
                files: [{
                    expand: true,
                    cwd: '<%= srcpath %>/site/common',
                    src: ['**/*.js', '**/*.html', '**/*.css'],
                    dest: 'static/site/common',
                    filter: 'isFile'
                }]
            },
            libs: {
                files: libCopyList
            },
            css: {
                files: [{
                    expand: true,
                    cwd: '<%= srcpath %>/site/css',
                    src: ['**/*.css'],
                    dest: 'static/site/css',
                    filter: 'isFile'
                }]
            }
        },
        sass: {
            common: {
                files: [{
                    expand: true,
                    cwd: '<%= srcpath %>/site/css',
                    src: ['*.scss'],
                    dest: '<%= srcpath %>/site/css',
                    ext: '.css'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-exec');
    grunt.registerTask('dev', ['exec:jadeCompileDev', 'sass', 'copy']);
    grunt.registerTask('prod', ['exec:jadeCompile', 'sass', 'copy']);
    //grunt.registerTask('prod', ['clean:all', 'sass', 'copy', 'html2js', 'concat:js', 'uglify', 'clean:html2js']);
    //grunt.registerTask('default', ['prod', 'concurrent:def']);
};
