const verifier = require("email-verify");
let fs = require("fs");
var util = require("util");

var log_file = fs.createWriteStream(__dirname + "/result.log", { flags: "w" });
var log_stdout = process.stdout;

console.log = function(d) {
  //
  log_file.write(util.format(d) + "\n");
  log_stdout.write(util.format(d) + "\n");
};

module.exports.soloVerify = emailListFileName => {
  const verifyCodes = verifier.verifyCodes;

  const getAddressFromTextFile = function(filepath) {
    let file = {
      exist: true,
      extension: require("path").extname(filepath),
      content: ""
    };

    let extensionErrorMsg =
      "Sorry, you needed to put addresses list into plain text (*.txt) file. Separated each address by new line";

    if (file.extension !== ".txt") throw new Error(extensionErrorMsg);

    try {
      file.content = fs.readFileSync(filepath, "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") console.log("File not found!", e);
      else console.log("Error: ", e);
      file.exist = false;
    } finally {
      if (!file.exist) {
        console.log("Error, File not found!");
        return [];
      } else {
        let addressList = file.content.split("\n"),
          addressObject = {};

        addressList.forEach(address => {
          if (address.length > 0) {
            addressObject[address] = true;
          }
        });

        return Object.keys(addressObject);
      }
    }
  };

  async function verifyAll() {
    //const files = await getFilePaths();
    const arr = await getAddressFromTextFile(emailListFileName);

    await Promise.all(
      arr.map(async item3 => {
        await verifier.verify(item3.trim(), function(err, info) {
          if (info.success)
            console.log(item3.trim() + " : Verification Success:\n");
          //console.log( "\x1b[32m%s\x1b[0m", item3.trim() + " : Verification Success:" );
          else console.log(item3.trim() + " : Verification Fail:\n");
          //console.log(   "\x1b[31m%s\x1b[0m",   item3.trim() + " : Verification Fail:");

          if (err) {
            console.log(
              "Cannot verify '" + item3.trim() + "'. Error Details:\n"
            );
            console.log(err);
          } else {
            //console.log(info.info);
            switch (info.code) {
              case verifyCodes.finishedVerification:
                console.log("Verification Control Completed\n"); //existing email: should respond with an object where success is true
                break;
              case verifyCodes.domainNotFound:
                console.log("Domain Not Found\n"); //non-existing domain: should respond with an object where success is false
                break;
              case verifyCodes.invalidEmailStructure: //badly formed email: should respond with an object where success is false
                console.log("Invalid Email Structure\n");
                break;
              case verifyCodes.noMxRecords:
                console.log("No MX Records");
                break;
              case verifyCodes.SMTPConnectionTimeout: //short timeout: should respond with an object where success is false
                console.log("SMTP Connection Timeout\n");
                break;
              case verifyCodes.SMTPConnectionError:
                console.log("SMTP Connection Error\n");
                break;

              default:
                console.log("Unknown Response\n");
            }
          }
          console.log("----------------------------------\n");
        });
      })
    );
  }

  verifyAll();
};
