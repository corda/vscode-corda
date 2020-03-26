"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var isWindows = process.platform === "win32";
        console.log(isWindows);
        if (isWindows) {
            child_process_1.exec("cd server && gradlew bootJar", function (err, stdout, stderr) {
                if (err) {
                    console.error('Failed to run compile client');
                }
                console.log(stdout);
            });
        }
        else {
            child_process_1.exec("cd server && ./gradlew bootJar", function (err, stdout, stderr) {
                if (err) {
                    console.error('Failed to run compile client');
                }
                console.log(stdout);
            });
        }
    });
}
main();
//# sourceMappingURL=runCompile.js.map