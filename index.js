const express = require('express')
const app = express()
const port = 3000

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());

const s7_adapter= require('./s7');
const s7_instance = new s7_adapter();

function translate2TxObj(reqObj){
    let operator = reqObj.operator.split('-'); // DB1:W
    let memoryInfo = operator[0].split(':'); // memoryInfo[0]:DB1 , memoryInfo[1]:W
    let txObj = {
        area: memoryInfo[0],
        unit: memoryInfo[1],
        method: operator[1],
        offset: Number(reqObj.offset),
        ioformat: reqObj.ioformat,
        parmVal: reqObj.value
    }
    return txObj;
}

app.get('/', (req, res) => {
    // translate2TxObj(req.params.reqObj)
    res.send('Hello World!')
})

app.post('/transaction', (req, res) => {
    let txObj = translate2TxObj(req.body);
    res.send(s7_instance.getRequestDataFormat(txObj));
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})