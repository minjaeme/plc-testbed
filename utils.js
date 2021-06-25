module.exports.SOCKET_CONNECTION_INFO = {
    CONNECT: {
        LABEL: "CONNECT",
        ENDPOINT_STATUS: "CONNECT"
    },
    CLOSE: {
        LABEL: "CLOSE",
        ENDPOINT_STATUS: "DISCONNECT"
    },
    ERROR: {
        LABEL: "ERROR",
        ENDPOINT_STATUS: "DISCONNECT"
    },
    EXPIRED: {
        LABEL: "EXPIRED",
        ENDPOINT_STATUS: "DISCONNECT"
    }
}

module.exports.ENDPOINT_CONNECTION_INFO = {
    CONNECT: {
        fill: "green", shape: "dot", text: "plc.connection.status.connect"
    },
    DISCONNECT: {
        fill: "red", shape: "ring", text: "plc.connection.status.disconnect"
    }
};

module.exports.PROTOCOL = {
    MC: {
        LABEL:"MC",
        PROCESS_TIME: 1,
        QUEUE_PREFIX:'PLC_MELSEC_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    XGT: {
        LABEL:"XGT",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_XGI_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    S7: {
        LABEL:"S7",
        PROCESS_TIME: 1,
        QUEUE_PREFIX:'PLC_S7_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    AB_EIP: {
        LABEL:"AB_EIP",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_AB_EIP_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    SCHNEIDER_EIP: {
        LABEL:"SCHNEIDER_EIP",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_SCHNEIDER_EIP_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    GE_SRTP: {
        LABEL:"GE_SRTP",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_GE_SRTP_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    ABB_CODESYS: {
        LABEL:"ABB_CODESYS",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_ABB_CODESYS_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    MEW: {
        LABEL:"MEW",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_MEW_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
    MICREX: {
        LABEL:"MICREX",
        PROCESS_TIME: 10,
        QUEUE_PREFIX:'PLC_MICREX_QUEUE',
        CONSTRAINT_OPERATOR:[]
    },
}

module.exports.sendConntionStatus = function (RED, nodeContext, SOCKET_STATUS) {
    nodeContext.log(RED._("plc.info." + SOCKET_STATUS.toLowerCase()));
    nodeContext.emit('ENDPOINT_STATUS_EVENT', this.SOCKET_CONNECTION_INFO[SOCKET_STATUS].ENDPOINT_STATUS)
}

module.exports.objectifyTx = function (value, txType) {
    let eventId = null;
    let area = null;
    let unit = null;
    let method = null;
    let offset = null;
    let parmVal = null;

    if (txType == "BUNDLE") {
        let combinationId = "";
        let bundle = value;
        let size = bundle.length;

        // Bundle의 경우, 구성 노드의 id 조합(연결) 필요
        bundle.forEach((singleNode, index) => {
            combinationId += singleNode.id
            if (index != size - 1) {
                combinationId += "|";
            }
        })

        eventId = combinationId;
        area = bundle[0].area;
        unit = bundle[0].unit;
        method = bundle[0].method;
        offset = bundle[0].address;
        parmVal = bundle[size - 1].address - bundle[0].address + 1; // Bundle Size
        ioformat = bundle[0].ioformat;
    } else {
        // txType == "INDIVIDUAL"
        let individualNode = value;
        eventId = individualNode.id;
        area = individualNode.area;
        unit = individualNode.unit;
        method = individualNode.method;
        offset = individualNode.address;
        parmVal = individualNode.parmVal;
        ioformat = individualNode.ioformat;
    }

    return {
        'eventId': eventId,
        'area': area,
        'unit': unit,
        'method': method,
        'offset': offset,
        'parmVal': parmVal,
        'ioformat': ioformat
    }
}
module.exports.convertHexFormat = function (d, digits = 6) {
    let number = (d).toString(16).toLowerCase();
    if ((number.length % 2) > 0) { number = "0" + number }
    len = number.length;
    if (len < digits) {
        for (let i = 0; i < (digits - len); i++) {
            number = "0" + number
        }
    }
    return number
}

module.exports.reverseDigits = function (v, digits = 2) {
    if (digits != 1 && digits != 2 && digits != 4) return
    regex = /..?/g;
    switch (digits) {
        case 1:
            regex = /.?/g;
            break;
        case 2:
            regex = /..?/g;
            break;
        case 4:
            regex = /....?/g
            break;
    }
    reversed = v.toString().match(regex)
    return reversed.reverse().join('')
}

module.exports.binary2Ascii = function (input) {
    var result = "";
    var arr = input.match(/.{1,8}/g);
    for (var i = 0; i < arr.length; i++) {
        result += String.fromCharCode(parseInt(arr[i], 2).toString(10));
    }
    return result;
}

module.exports.dec2hex = function (d) {
    return "0x" + (+d).toString(16).toLowerCase();
}

module.exports.ascii2Binary = function (input) {
    var result = "";
    for (var i = 0; i < input.length; i++) {
        var bin = input[i].charCodeAt().toString(2);
        result += Array(8 - bin.length + 1).join("0") + bin;
    }
    return result;
}

module.exports.hex2ascii = function (hex) {
    result = String.fromCharCode(parseInt(hex, 16));
    return result;
}

module.exports.ascii2hex = function (str) {
    var arr = [];
    for (var i = 0, l = str.length; i < l; i++) {
        var hex = Number(str.charCodeAt(i)).toString(16);
        arr.push(hex);
    }
    return arr.join('');
}

module.exports.logger = function (msg) {
    console.log(
        "[" + new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul'
        }) + "]", msg)
}

module.exports.HexString2BinaryString = function (hex) {
    var hexCode = {
        '0': "0000",
        '1': "0001",
        '2': "0010",
        '3': "0011",
        '4': "0100",
        '5': "0101",
        '6': "0110",
        '7': "0111",
        '8': "1000",
        '9': "1001",
        'a': "1010",
        'b': "1011",
        'c': "1100",
        'd': "1101",
        'e': "1110",
        'f': "1111"
    };

    hex = hex.toLowerCase();
    var binary = "";
    for (var i = 0; i < hex.length; i++) {
        binary += hexCode[hex[i]];
    }
    
    return binary;
}

module.exports.word2ascii = function (hex) {

}