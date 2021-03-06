const fs = require('fs')
const path = require('path')

// 更改 import 语句中的后缀
replace('JSchema', ['NiceError'])
replace('JRequest', ['JSchema', 'NiceError'])
replace('JExecutor', ['NiceError', 'JSchema', 'JRequest'])

function replace(fileName, codeFiles) {
    let filePath = path.join(process.cwd(),'src',`${fileName}.ts`)
    let content = fs.readFileSync(filePath, 'utf-8')
    for (let i=0; i<codeFiles.length; i++) {
        let codeFile = codeFiles[i]
        content = content.replace(`./${codeFile}.js`,`./${codeFile}.ts`)
    }
    fs.writeFileSync(filePath, content)
}

process.exit()