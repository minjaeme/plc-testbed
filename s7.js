// ■ TCP Layer's PDU (Segment): ⑴ TCP Header + ⑵ TCP Data(=Applcation layers' PDU)
// 상기 ⑵ Applcation layers' PDU: Header(=Applcation Layer's 'Protocol Data Interface') + Message(=Applcation Layer's 'Service Data Unit')
// ※ 사실 Applcation 계층에서는 TCP 계층으로 ICI(오류가 아님을 증명할 제어 정보)로 같이 보내지만 TCP 계층에서는 오류 여부 확인 후, 그 값을 버린다.
//    즉, 실질적으로 Segment 내 Data 영역에 자리 잡는 것은 애플리케이션 계층의 'PDI + SDU' 이다.

let Util = require('./utils');

// 최종적으로 리턴할 문자열은 'TCP Data'를 의미하며, 이는 'Applcation 계층'의  Header + Instruction 의 조합으로 규정한다.
// → Protocol 클래스에서는 'Application 계층'에 대한 표시를 굳이 명시적으로 나타내지 않는 것을 원칙으로 한다.

// 헤더(고정값) 지정
const READ_HEADER_PREFIX = new Buffer.from([
    0x03, 0x00, 0x00,
    0x1f, // TCP Data 의 바이트 길이
    0x02, 0xf0, 0x80, 0x32, 0x01, 0x00, 0x00, 0x00, 0x02, 0x00,
    0x0e, // Instruction 의 바이트 길이
    0x00, 0x00
]);

const READ_FRAME_AFFIXES = [
    new Buffer.from([
        0x04, 
        0x01, // 접근할 블록의 총 개수를 의미
        0x12, 0x0a, 0x10, 0x02 
    ]),
    new Buffer.from([
        0x84, 0x00 
    ]),
];

const WIRTE_HEADER_AFFIXES = [
    new Buffer.from([
        0x03, 0x00, 0x00
    ]),
    // ② 요청문의 바이트 개수
    new Buffer.from([
        0x02, 0xf0, 0x80, 0x32, 0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x0e, 0x00
    ]),
    // ④ '입력 바이트 개수 + 4'
    new Buffer.from([
        0x05, 0x01
    ])
];
// Word 입력을 요청받았지만 실제로는 바이트 연속 쓰기로 처리해야한다.
// 030000 29 02f080320100000003000e00 0a(= 6 + 4) 0501120a10 '02' 0006(바이트 개수) 0001(공간) 8400 0000(오프셋) 0004 0030(바이트 사이즈를 비트로 변환) 000000000000
const WIRTE_FRAME_AFFIXES = [
    new Buffer.from([
        0x12, 0x0a, 0x10
    ]),
    // ② '일괄 쓰기 여부' 코드_1
    // ③ 입력 바이트 사이즈
    // ④ 메모리 공간 순서
    new Buffer.from([
        0x84, 0x00
    ])
    // ⑥ (비트 기준의) 오프셋
    // ⑦ '일괄 쓰기 여부' 코드_2
    // ⑧ 다음에 이어질 바이트에서 실제로 사용될 비트 사이즈, (비트 쓰기의 경우 항상 1, 그 외는 = 바이트 사이즈 * 8)
    // ⑨ 입력할 바이트 나열
];

const MEMORY_AREA = {
    'P': 0x80,
    'I': 0x81,
    'Q': 0x82,
    'M': 0x83,
    'DB': 0x84
}

const REQ_MAX_PDU = 960;
const REQ_MAX_PARALLEL = 8;

module.exports = class S7 {
    constructor(){
    }

    getRequestDataFormat(txObj) {
        let self = this;
        let method = txObj.method;
        return method == 'R' ? self._getReadDataFormat(txObj) : self._getWriteDataFormat(txObj);
    }

    _getReadDataFormat(txObj){

        function __translateReadSize(txObj){
            let orgnUnit = txObj.unit;
            // '읽고자 하는 orgnUnit의 개수'와 동치이다.
            let orgnReadSize = txObj.parmVal;
            // S7 프로토콜 명세는 '바이트' 사이즈를 공통으로 한다.
            let byteSize = null;
            let readSizeObj = {};

            if (orgnUnit === 'W'){
                byteSize = orgnReadSize * 2;
            }
            else if (orgnUnit === 'X'){
                // Calculate byte boundaries Using Bit Offset
                // 비트 오프셋을 통해 읽어내야 하는 총 바이트 크기(사이즈)를 계산한다.
                let startBitffset = txObj.offset;
                let lastBitOffset = startBitffset + (orgnReadSize - 1);
                byteSize = parseInt(lastBitOffset / 8) - parseInt(startBitffset / 8) + 1 ;     
            }else{
                // Byte Size
                byteSize = orgnReadSize;
            }
            readSizeObj.B = byteSize;
            return readSizeObj;
        }

        function __translateMemoryArea(txObj) {
            let memoryArea = null;
            
            MEMORY_AREA.P
        }

        let self = this;
        let data = null;

        // 1. 메모리 영역
        let memArea = parseInt(txObj.area.substring(2));
    
        // 2. 오프셋
        // - 2.1. orgnOffset: 사용자가 지정한 연산 단위의 오프셋
        // - 2.2. (실제 프로토콜 명세를 따르는)오프셋
        let trnslOffsetObj = self._translateOffset(txObj);

        // 3. 읽기 사이즈
        // - 3.1. orgnReadSize: 사용자가 지정한 단위의 읽기 사이즈
        // - 3.2. (실제 프로토콜 명세를 따르는)읽기 사이즈
        let trnslReadSizeObj = __translateReadSize(txObj);

        // 4. 메모리 영역
        
        // let trnslMemoryAreaObj = 

        // Q. 문자열 합산 VS 버퍼 합산에서 어느 쪽이 연산 속도면에서 우월한가?
        // ■ HEADER
        let header = READ_HEADER_PREFIX.toString('hex');
        // ■ MESSAGE
        let msg = READ_FRAME_AFFIXES[0].toString('hex')
                    + Util.convertHexFormat(trnslReadSizeObj.B, 4)
                    + Util.convertHexFormat(memArea, 4)
//                     + Util.convertHexFormat(trnslMemoryAreaObj)
                    + READ_FRAME_AFFIXES[1].toString('hex')
                    + Util.convertHexFormat(trnslOffsetObj.X, 4)
        data = header + msg;
        return data;
    }

    _getWriteDataFormat(txObj){

        function __translateWriteSize(txObj){
            
            let orgnUnit = txObj.unit;
            let ioformat = txObj.ioformat;

            // '쓰고자 하는 orgnUnit의 개수'와 동치이다.
            let orgnWriteInput = txObj.parmVal;
            let inputValToken = orgnWriteInput.split(',');

            // S7 프로토콜 명세는 '바이트'와 '비트' 사이즈 2개를 요구한다. 
            let byteSize = null;
            let writeSizeObj = {};

            if (orgnUnit === 'W'){
                if(ioformat === 'CHAR'){
                    let totalCharSize = 0;
                    for(let i = 0; i < inputValToken.length; i++){
                        let isOddCnt = inputValToken[i].length % 2;
                        totalCharSize +=  inputValToken[i].length;
                        if(isOddCnt){
                            totalCharSize += 1;
                        }
                    }
                    byteSize = totalCharSize;
                }else{
                    byteSize = inputValToken.length * 2;
                }
                writeSizeObj.B = byteSize;
                writeSizeObj.X = byteSize * 8;
            }
            else if (orgnUnit === 'X'){
                // Bit 는 연속 쓰기를 지원하지 않는다.
                writeSizeObj.B = 1;
                writeSizeObj.X = 1;
            }else{
                // Byte Size
                byteSize = inputValToken.length;
                writeSizeObj.B = byteSize;
                writeSizeObj.X = byteSize * 8;
            }
            return writeSizeObj;
        } 

        function __translateInputVal(txObj){
            let orgnUnit = txObj.unit;
            let ioformat = txObj.ioformat;

            // '쓰고자 하는 orgnUnit의 개수'와 동치이다.
            let orgnWriteInput = txObj.parmVal;
            let inputValToken = orgnWriteInput.split(',');
      
            function convertInputValByIOFormat(val, n){
                let convertedInputVal = null;
                if(ioformat === 'DEC'){
                    val = parseInt(val).toString(16);
                    convertedInputVal = val.padStart(n, 0);
                }else if(ioformat === 'CHAR'){
                    convertedInputVal = '';
                    let isOddCnt =  val.length % 2;
                    if(orgnUnit === 'W'){
                        for(let i = 0; i < val.length; i++){
                            let asciiHexString = val.charCodeAt(i).toString(16);
                            if(i === val.length - 1 && isOddCnt ){
                                // 홀수 크기의 문자열의 마지막 글자라면 워드 형태로 만들기 위해 후미에 00을 덧붙여야 한다.
                                asciiHexString = asciiHexString.padEnd(4, 0);
                            }
                            convertedInputVal += asciiHexString;
                        }
                    }else{
                        // orgnUnit === 'B'
                        // 바이트 1글자를 대상으로 한다.
                        asciiHexString = val.charCodeAt(0).toString(16);
                        convertedInputVal += asciiHexString;
                    }
                }else{
                    convertedInputVal = val.padStart(n, 0);
                }
                return convertedInputVal;
            }

            // 단수 혹은 복수의 '입력 값'(들)을 하나로 직렬화한다.
            let serializedInputVal = '';
            
            for(let i = 0; i < inputValToken.length; i++){
                let token = inputValToken[i];
                if(orgnUnit === 'X'){
                    // '비트'는 연속 쓰기 기능 미지원
                    serializedInputVal = convertInputValByIOFormat(token, 2);
                }else if(orgnUnit === 'B'){
                    // Byte
                    serializedInputVal += convertInputValByIOFormat(token, 2);
                }else{
                    // Word
                    serializedInputVal += convertInputValByIOFormat(token, 4);
                }
            }
            return serializedInputVal;
        }

        let self = this;
        let data = null;

        // 1. 메모리 영역
        let memArea = parseInt(txObj.area.substring(2));
        let orgnUnit = txObj.unit;

         // 2. 오프셋
        // - 2.1. orgnOffset: 사용자가 지정한 연산 단위의 오프셋
        // - 2.2. (실제 프로토콜 명세를 따르는)오프셋
        let trnslOffsetObj = self._translateOffset(txObj);
        // trnslOffsetObj.X = 15
        // let trnslBitOffset = self._translateOffset(txObj, X);

        // 3. 쓰기 사이즈
        // - 3.1 '연속 쓰기 여부' 검사 후, '쓰기 사이즈(여기서는 바이트 기준)' 리턴
        // - 3.2. (실제 프로토콜 명세를 따르는) 쓰기 사이즈
        let trnslWriteSizeObj = __translateWriteSize(txObj);
        // let trnslWriteByteSize = __translateWriteSize(txObj, targetOffsetUnit);
        // let trnslWriteBitSize = __translateWriteSize(txObj, targetOffsetUnit);

        // 4. 입력 값
        // Buffer 문자열로 반환
        let trnslInputVal = __translateInputVal(txObj);

        // 5. 연산별 연속(일괄) 쓰기 코드 분기
        // '비트' 연산은 '배치 쓰기' 불가능
        let batchCodeArr = orgnUnit === 'X' ?  ['01', '0003'] : ['02', '0004']; 
        
        // HEADER
        let header = WIRTE_HEADER_AFFIXES[0].toString('hex')
                    + Util.convertHexFormat(35 + trnslWriteSizeObj.B, 2) // Param Length
                    + WIRTE_HEADER_AFFIXES[1].toString('hex') // 
                    + Util.convertHexFormat(trnslWriteSizeObj.B + 4, 2) //  Data Length
                    + WIRTE_HEADER_AFFIXES[2].toString('hex');

        // MESSAGE
        let msg = WIRTE_FRAME_AFFIXES[0].toString('hex')
                    + batchCodeArr[0]
                    + Util.convertHexFormat(trnslWriteSizeObj.B, 4)
                    + Util.convertHexFormat(memArea, 4)
                    + WIRTE_FRAME_AFFIXES[1].toString('hex')
                    + Util.convertHexFormat(trnslOffsetObj.X, 4) // 3 Byte ,Bit offst
                    //
                    + batchCodeArr[1]
                    + Util.convertHexFormat(trnslWriteSizeObj.X, 4)
                    + trnslInputVal;

        data = header + msg;
        return data;
    }

    _translateOffset= function(txObj){
        let orgnUnit = txObj.unit;
        // '읽고자하는 orgnUnit의 오프셋'과 동치이다. 
        let orgnOffset = txObj.offset;
        // S7 프로토콜 명세는 '비트' 오프셋을 공통으로 한다.
        let translatedOffset = null;
        let method = txObj.method;
        let offsetObj = {};

        if (orgnUnit === 'W'){
            // Ex1) 0번째 Word → Bit Offset 0
            // EX2) 1번째 Word → Bit Offset 16
            // 상기 Word의 교집합 부분인 Bit Offset 8 지점의 Word 는 어떻게 해야 할까? → Word Offset 0.5 을 받는다.
            translatedOffset = orgnOffset * 16;
        }
        else if(orgnUnit === 'X'){
            let byteBoundaryOffset = parseInt(orgnOffset / 8) * 8;
            if(method === 'R'){
                // READ: 항상 경계선에 놓인 '바이트 오프셋'을 읽어내야 한다.
                translatedOffset = byteBoundaryOffset;
            }else{
                let bitIndex = orgnOffset % 8;
                translatedOffset = byteBoundaryOffset + bitIndex;
            }
        }else{
            // Byte Offset
            translatedOffset = orgnOffset * 8;
        }
        offsetObj.X = translatedOffset;
        return offsetObj;
    }

    getResponseDataFormat(rawData, txObj) {

        let method = txObj.method;
        let orgnUnit = txObj.unit;

        if(method === 'R'){
            rawData = rawData.substring(50);
            if(orgnUnit === 'X'){
                let bitLength = parseInt(txObj.parmVal);
                let binarizedString = Util.HexString2BinaryString(rawData);
                /** essentialBinary 의 배열 내의 순서를 실제 비트 인덱스에 맞게 정렬해야 한다. */
                let essentialBinary = null;
                let sortedBuf = [];
                for(let i = 0; i < binarizedString.length; i ++){
                    let byteBoundaryOffset = parseInt(i/8) * 8;
                    let convertedBitIndex = byteBoundaryOffset + 7 - (i % 8); 
                    sortedBuf[convertedBitIndex] = binarizedString[i];
                }
                essentialBinary = sortedBuf.join('');
                let cuttingBoundaryIndex = txObj.offset % 8;
                
                essentialBinary = essentialBinary.substring(cuttingBoundaryIndex, cuttingBoundaryIndex + bitLength);
                return essentialBinary;
            }else{
                // Word OR Byte
                return rawData;
            }
        }else{
            return txObj.parmVal;
        }
    }
}
