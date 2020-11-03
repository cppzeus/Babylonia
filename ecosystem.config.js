// 설정파일
module.exports = {
    apps: [{
        name: 'app',
        script: './bin/www',
        instances: 0,
        exec_mode: `cluster`
    }]
};