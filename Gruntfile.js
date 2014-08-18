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
					testname: "miniLock QUnit Tests",
					username: "kaepora",
					key: "131ae777-402f-464c-88e7-6a6e7c8e8727"
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
