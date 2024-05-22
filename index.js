
const fs = require("fs");


class ParsedForm {

    constructor() {

        this.data = [];

    }

    pushData(dt) {

        this.data.push(dt);

    }

    getData() {

        return this.data;

    }

}

class InputData {

    constructor () {

        this.headers = {}

        this.name = undefined;

        this.value = undefined;

        this.filename = undefined;

    }

    setHead(key, value) {

        this.headers[key] = value;

    }

    getHead(key) {

        return this.headers[key];

    }

    setName (val) {

        this.name = val;

    }

    getName () {

        return this.name;

    }

    setValue (val) {

        this.value = val;

    }

    getValue () {

        return this.value;

    }

    setFileName (val) {

        this.filename = val;

    }

    getFileName () {

        return this.filename;

    }    

}

function FormParser (data) {

    const jsonBuf = JSON.parse(JSON.stringify(data));

    const uInt8Buf = jsonBuf.data;
    
    const form = new ParsedForm();

    let input = 0;

    let blbound = false;

    let blhead = false;

    let blval = false;

    let reader = [];

    const regexp_bound = /--([^\r]+)\r\n/;

    const regexp_disposition = /Content-Disposition:([^;]+);/;

    const regexp_type = /Content-Type:([^\r]+)\r\n/;

    const regexp_name = /name="([^"]+)"/;

    const regexp_file = /filename="([^"]+)"/;

   // console.log(uInt8Buf);

    for (let i = 0; i < uInt8Buf.length; i++) { 

        if (!blbound && !blhead && !blval) {

            blbound = true;

            input = new InputData();

        } else if (blbound && !blhead && !blval) {

            reader.push(uInt8Buf[i]);

            if (reader.length >= 2) {

                if (reader[reader.length-2] === 13 && reader[reader.length-1] === 10) {

                    let string = "";
    
                    reader.forEach(val => {
    
                        string += String.fromCharCode(val);
    
                    });
    
                    //console.log(string);

                    const match = string.match(regexp_bound);

                    if (match) {

                        //console.log(match);

                        blhead = true;

                    }

                    reader = [];
    
                }

            }

        } else if (blbound && blhead && !blval) {

            reader.push(uInt8Buf[i]);

            if (reader.length >= 2) {

                if (reader[reader.length-2] === 13 && reader[reader.length-1] === 10) {

                    let string = "";
    
                    reader.forEach(val => {
    
                        string += String.fromCharCode(val);
    
                    });
    
                    //console.log(string);

                    const match_disposition = string.match(regexp_disposition);
                    
                    if (match_disposition) {

                        //console.log(match_disposition);

                        input.setHead("Content-Disposition", match_disposition[1]);

                    }

                    const match_type = string.match(regexp_type);
                    
                    if (match_type) {

                        //console.log(match_type);

                        input.setHead("Content-Type", match_type[1].trim());

                    }

                    const match_name = string.match(regexp_name);

                    if (match_name) {

                        //console.log(match_name);

                        input.setName(match_name[1]);

                        const match_file = string.match(regexp_file);

                        if (match_file) {
    
                            //console.log(match_file);
    
                            input.setFileName(match_file[1]);
                            
                        }
                        
                    }

                    if (reader.length === 2) {

                        blbound = false;

                        blval = true;

                        //console.log(blbound, blhead, blval);                        

                    }

                    reader = [];

                    //console.log(input);

                }

            }

        } else if (!blbound && blhead && blval) {

            if (uInt8Buf[i] === 45 && uInt8Buf[i+1] === 45 && uInt8Buf[i+2] === 45 && uInt8Buf[i+3] === 45) {

                blval = false;

                blhead = false;

                blbound = false;

                input.setValue(reader);

                form.pushData(input);

                reader = [];

                //console.log(input);

            }

            if (uInt8Buf !== 10) reader.push(uInt8Buf[i]);  

        }

    }

    console.log(form.data);

    for (let i in form.data) {

        if (form.data[i].filename !== undefined) {

            fs.writeFileSync("./"+form.data[i].filename, Buffer.from(form.data[i].value));

        } else {

            console.log(Buffer.from(form.data[i].value).toString());
        }

    }

    //

}
