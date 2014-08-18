module.exports = function(grunt) {
	grunt.initConfig({
		connect: {
			server: {
				options: {
					base: ".",
					port: 9999
				}
			}
		},
		"saucelabs-qunit": {
			all: {
				options: {
					urls: ["http://127.0.0.1:9999/test/mUTK.html"],
					build: process.env.TRAVIS_JOB_ID,
					browsers: [{ browserName: "chrome" }],
					testname: "miniLock qunit tests",
					username: "thisisatest",
					key: "6b4c8849-1434-4ccf-a2bf-796400cbf5cb"
				}
			}
		}
	})

	for (var key in grunt.file.readJSON("package.json").devDependencies) {
		if (key !== "grunt" && key.indexOf("grunt") === 0) {
			grunt.loadNpmTasks(key)
		}
	}

	grunt.registerTask("test", ["connect", "saucelabs-qunit"])
}