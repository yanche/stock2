pushd .
C:
START cmd.exe /c mongod
popd
START cmd.exe /c tsc -w
START cmd.exe /c mongo
START cmd.exe /c node index.js d -d
START cmd.exe /c node index.js p -d
START cmd.exe /c node index.js c -d
START chrome.exe http://127.0.0.1:8081/
