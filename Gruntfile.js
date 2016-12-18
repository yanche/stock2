
const angularLibs = ['common', 'compiler', 'core', 'forms', 'http', 'platform-browser', 'platform-browser-dynamic', 'router'];
const libCopyList = angularLibs.map(name=>{
    return {
        src: `node_modules/@angular/${name}/bundles/${name}.umd.min.js`,
        dest: `static/libs/js/${name}.umd.min.js`
    };
}).concat([{
    src: 'node_modules/zone.js/dist/zone.min.js',
    dest: 'zone.min.js'
},{
    src: 'node_modules/rxjs/bundles/Rx.min.js',
    dest: 'Rx.min.js'
}]);

module.exports = function(grunt) {
    grunt.initConfig({
        srcpath: 'src/node_modules/nodes/producer',
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
                    src: ['**/*.js'],
                    dest: 'static/site/admin/js',
                    filter: 'isFile'
                }]
            },
            jsLibs: {
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
    grunt.registerTask('dev', ['exec:jadeCompile', 'copy']);
    //grunt.registerTask('prod', ['clean:all', 'sass', 'copy', 'html2js', 'concat:js', 'uglify', 'clean:html2js']);
    grunt.registerTask('default', ['prod', 'concurrent:def']);
};