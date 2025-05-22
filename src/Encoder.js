const _encode = [
    'thing', ' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
    '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
    '', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~'
];

const itemNumOf = (arr, targetValue) => 1 + arr.findIndex((value) => value.toLowerCase() === targetValue);
const letterOf = (arr, index) => arr[index - 1];

export class Encoder {
    constructor() {
        this.parseStr = "";
        this.parseIdx = 1;
        this.Val = "0";
        this.timer = 0;
    }

    initReader(text) {
        this.parseStr = text;
        this.parseIdx = 1;
    }

    writeNumber(val) {
        if (val < 0) {
            this.Val = val < -99999999 ? "0" : "0" + Math.abs(Math.round(val));
        } else {
            this.Val = val > 99999999 ? "0" : String(Math.round(val));
        }
        this.parseStr += this.Val.length + this.Val;
    }

    readNumber() {
        this.Val = "0";
        let cached = parseInt(letterOf(this.parseStr, this.parseIdx));
        for (let i = 0; i < cached; i++) {
            this.parseIdx += 1;
            this.Val = parseInt(String(this.Val) + parseInt(letterOf(this.parseStr, this.parseIdx)));
        }

        if (this.Val[2] === '0') {
            this.Val = 0 - this.Val;
        }

        this.parseIdx += 1;
    }

    writeString(txt) {
        this.writeNumber(txt.length);
        this.Val = "";

        for (let i = 0; i < txt.length; i++) {
            let i2 = itemNumOf(_encode, txt[i].toLowerCase());
            this.Val += i2 < 10 ? "0" + i2 : i2;
        }

        this.parseStr += this.Val;
    }

    readString() {
        this.readNumber();

        let i2;
        if (this.parseIdx + (this.Val * 2) > this.parseStr.length + 1) {
            i2 = ((this.parseStr.length + 1) - this.parseIdx) / 2;
        } else {
            i2 = this.Val;
        }

        this.Val = "";
        let cachedI2 = i2;

        for (let i = 0; i < parseInt(cachedI2); i++) {
            let code = parseInt(
                letterOf(this.parseStr, this.parseIdx) +
                letterOf(this.parseStr, this.parseIdx + 1)
            );
            this.Val += letterOf(_encode, code);
            this.parseIdx += 2;
        }
    }

    skipString() {
        this.readNumber();
        this.parseIdx += this.Val * 2;
    }

    writeChange(val) {
        if (Math.abs(val) < 50) {
            this.parseStr += val < -40 ? "0" + (val + 50) : String(val + 50);
        } else {
            this.parseStr += "00";
            this.timer += 100;
        }
    }

    getResult() {
        return this.parseStr;
    }

    getValue() {
        return this.Val;
    }
}
