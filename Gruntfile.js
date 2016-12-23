
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
    expand: true,
    cwd: 'bower_components/font-awesome/fonts',
    src: ['**'],
    dest: 'static/libs/font',
    filter: 'isFile'
}]);

module.exports = function (grunt) {
    grunt.initConfig({
        srcpath: 'src/nodes/producer',
        exec: {
            jadeCompile: {
                cmd: 'node <%= srcpath %>/jadecompile.js',
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
                }, {
                    src: '<%= srcpath %>/admin.dev.systemjs.config.js',
                    dest: 'static/admin.dev.systemjs.config.js'
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
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-jade');
    grunt.loadNpmTasks('grunt-exec');
    grunt.registerTask('dev', ['exec:jadeCompile', 'copy']);
    //grunt.registerTask('prod', ['clean:all', 'sass', 'copy', 'html2js', 'concat:js', 'uglify', 'clean:html2js']);
    grunt.registerTask('default', ['prod', 'concurrent:def']);
};