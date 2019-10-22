import { exec } from 'child_process';

async function main() {

	var isWindows = process.platform === "win32";
	console.log(isWindows);
	if(isWindows){
		exec("cd server && gradlew client:build", function(err, stdout, stderr) {
			if (err) {
				console.error('Failed to run compile client');
			}
			console.log(stdout);
		});
	}else{
		exec("cd server && ./gradlew client:build", function(err, stdout, stderr) {
			if (err) {
				console.error('Failed to run compile client');
			}
			console.log(stdout);
		});
	}

}

main();
